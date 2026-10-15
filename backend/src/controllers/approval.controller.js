import { query, pool } from '../config/db.js';

// Get all pending submissions with employee details and nested goals
export const getPendingApprovals = async (req, res) => {
  try {
    // 1. Fetch pending submissions and join with users to get employee details
    const submissionsResult = await query(
      `SELECT 
         gs.id, gs.user_id as employee_id, gs.period, gs.status, gs.created_at,
         u.name as employee_name, u.email as employee_email
       FROM public.goal_submissions gs
       JOIN public.users u ON gs.user_id = u.id
       WHERE gs.status = 'pending_approval' AND gs.user_id <> $1
       ORDER BY gs.created_at ASC`,
      [req.user.id]
    );

    if (submissionsResult.rows.length === 0) {
      return res.json({ submissions: [] });
    }

    const submissionIds = submissionsResult.rows.map(s => s.id);

    // 2. Fetch all goals associated with these submissions
    const goalsResult = await query(
      `SELECT * FROM public.goals WHERE submission_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [submissionIds]
    );

    // 3. Group goals by submission
    const submissions = submissionsResult.rows.map(sub => {
      return {
        ...sub,
        goals: goalsResult.rows.filter(g => g.submission_id === sub.id)
      };
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Approve or reject a submission
export const updateSubmissionStatus = async (req, res) => {
  const client = await pool.connect();
  let inTransaction = false;

  try {
    const managerId = req.user.id;
    const { submissionId } = req.params;
    const { action, remarks, goals } = req.body; // action: 'approved' or 'rejected'

    if (!action || !['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approved or rejected.' });
    }

    // 1. Verify submission exists and is pending
    const submissionCheck = await client.query(
      'SELECT id, user_id, status FROM public.goal_submissions WHERE id = $1',
      [submissionId]
    );

    if (submissionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Submission not found.' });
    }

    if (submissionCheck.rows[0].status !== 'pending_approval') {
      return res.status(400).json({ error: 'Only pending_approval submissions can be reviewed.' });
    }

    if (submissionCheck.rows[0].user_id === managerId) {
      return res.status(403).json({ error: 'You cannot review your own goal submission.' });
    }

    // 2. Begin transaction
    await client.query('BEGIN');
    inTransaction = true;

    // Re-check status under a row lock so two reviewers can't act on the same submission
    const locked = await client.query(
      'SELECT status FROM public.goal_submissions WHERE id = $1 FOR UPDATE',
      [submissionId]
    );
    if (locked.rows[0].status !== 'pending_approval') {
      await client.query('ROLLBACK');
      inTransaction = false;
      return res.status(409).json({ error: 'This submission has already been reviewed.' });
    }

    // Update submission status
    await client.query(
      'UPDATE public.goal_submissions SET status = $1, updated_at = NOW() WHERE id = $2',
      [action, submissionId]
    );

    // 3. Insert tracking record into approvals table
    await client.query(
      `INSERT INTO public.approvals (submission_id, manager_id, approval_action, remarks) 
       VALUES ($1, $2, $3, $4)`,
      [submissionId, managerId, action, remarks || null]
    );

    // 4. (Optional) Process inline edits to goals by the manager
    if (goals && Array.isArray(goals) && goals.length > 0) {
      for (const editedGoal of goals) {
        if (editedGoal.id && (editedGoal.target_value !== undefined || editedGoal.weightage !== undefined)) {
          await client.query(
            'UPDATE public.goals SET target_value = COALESCE($1, target_value), weightage = COALESCE($2, weightage) WHERE id = $3 AND submission_id = $4',
            [editedGoal.target_value, editedGoal.weightage, editedGoal.id, submissionId]
          );
        }
      }
    }

    await client.query('COMMIT');
    inTransaction = false;
    res.json({ message: `Submission successfully ${action}.` });
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK').catch(() => {});
    console.error('Error updating submission status:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

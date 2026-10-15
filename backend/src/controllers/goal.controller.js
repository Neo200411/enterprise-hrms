import { query, pool } from '../config/db.js';

const EMPLOYEE_STATUSES = ['draft', 'pending_approval'];
const MAX_GOALS = 8;
const MIN_WEIGHTAGE = 10;

// Get current user's goals
export const getMyGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    // Each submission with the manager's most recent decision (so employees can see rework remarks)
    const submissionsResult = await query(
      `SELECT gs.id, gs.period, gs.status,
              (SELECT a.remarks FROM public.approvals a
               WHERE a.submission_id = gs.id
               ORDER BY a.created_at DESC LIMIT 1) AS manager_remarks
       FROM public.goal_submissions gs
       WHERE gs.user_id = $1
       ORDER BY gs.created_at DESC`,
      [userId]
    );

    if (submissionsResult.rows.length === 0) {
      return res.json({ submissions: [] });
    }

    const submissionIds = submissionsResult.rows.map(s => s.id);
    const goalsResult = await query(
      `SELECT * FROM public.goals WHERE submission_id = ANY($1::uuid[]) ORDER BY created_at ASC`,
      [submissionIds]
    );

    // Group goals by submission
    const submissions = submissionsResult.rows.map(sub => {
      return {
        ...sub,
        goals: goalsResult.rows.filter(g => g.submission_id === sub.id)
      };
    });

    res.json({ submissions });
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Replace user's goals (submit draft or for approval)
export const submitGoals = async (req, res) => {
  const userId = req.user.id;
  const { period, status, goals } = req.body;

  if (!period || !status || !Array.isArray(goals)) {
    return res.status(400).json({ error: 'Missing period, status, or valid goals array' });
  }

  // Employees can only save drafts or submit for approval; approval is a manager action
  if (!EMPLOYEE_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${EMPLOYEE_STATUSES.join(', ')}` });
  }

  if (goals.length > MAX_GOALS) {
    return res.status(400).json({ error: `Maximum ${MAX_GOALS} goals allowed` });
  }

  if (status === 'pending_approval') {
    if (goals.length === 0) {
      return res.status(400).json({ error: 'At least one goal is required to submit for approval' });
    }
    if (goals.some(g => !(Number(g.weightage) >= MIN_WEIGHTAGE))) {
      return res.status(400).json({ error: `Each goal must have at least ${MIN_WEIGHTAGE}% weightage` });
    }
    const totalWeightage = goals.reduce((sum, g) => sum + Number(g.weightage || 0), 0);
    if (totalWeightage !== 100) {
      return res.status(400).json({ error: `Total weightage must equal exactly 100%. Current total: ${totalWeightage}%` });
    }
  }

  const client = await pool.connect();
  let inTransaction = false;

  try {
    await client.query('BEGIN');
    inTransaction = true;

    // 1. Check if a submission for this period already exists (lock it against concurrent edits)
    let submissionResult = await client.query(
      'SELECT id, status FROM public.goal_submissions WHERE user_id = $1 AND period = $2 FOR UPDATE',
      [userId, period]
    );

    let submissionId;

    if (submissionResult.rows.length > 0) {
      const existingSubmission = submissionResult.rows[0];
      submissionId = existingSubmission.id;
      const currentStatus = existingSubmission.status;

      // Only drafts and rejected submissions can be edited
      if (currentStatus === 'approved') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Cannot modify approved goals.' });
      }

      if (currentStatus === 'pending_approval') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Cannot modify goals currently pending approval.' });
      }

      await client.query(
        'UPDATE public.goal_submissions SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, submissionId]
      );

      // Delete existing goals for this submission to replace them
      await client.query('DELETE FROM public.goals WHERE submission_id = $1', [submissionId]);
    } else {
      // Create new submission
      submissionResult = await client.query(
        `INSERT INTO public.goal_submissions (user_id, period, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [userId, period, status]
      );
      submissionId = submissionResult.rows[0].id;
    }

    // 2. Insert new goals linked to the submission_id
    let insertedGoals = [];
    if (goals.length > 0) {
      const values = [];
      const placeholders = [];
      
      let paramIndex = 1;
      for (const goal of goals) {
        placeholders.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
        values.push(
          submissionId,
          goal.thrust_area || '',
          goal.goal_title || '',
          goal.description || '',
          goal.uom_type || '',
          goal.measurement_type || '',
          Number(goal.target_value) || 0,
          Number(goal.weightage) || 0
        );
      }

      const insertResult = await client.query(
        `INSERT INTO public.goals (submission_id, thrust_area, goal_title, description, uom_type, measurement_type, target_value, weightage)
         VALUES ${placeholders.join(', ')}
         RETURNING *`,
        values
      );
      insertedGoals = insertResult.rows;
    }

    await client.query('COMMIT');
    inTransaction = false;

    res.status(201).json({
      submission_id: submissionId,
      status,
      goals: insertedGoals,
      message: insertedGoals.length > 0 ? 'Goals submitted successfully' : 'Submission saved with no goals'
    });
  } catch (error) {
    if (inTransaction) await client.query('ROLLBACK').catch(() => {});
    console.error('Error submitting goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

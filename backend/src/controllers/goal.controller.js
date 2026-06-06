import { query } from '../config/db.js';

// Get current user's goals
export const getMyGoals = async (req, res) => {
  try {
    const userId = req.user.id;
    // According to schema: goal_submissions(id, user_id, period, status)
    // and goals(id, submission_id, thrust_area, ...)
    
    // We fetch submissions and their associated goals
    const submissionsResult = await query(
      'SELECT id, period, status FROM public.goal_submissions WHERE user_id = $1 ORDER BY created_at DESC',
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
  try {
    const userId = req.user.id;
    const { period, status, goals } = req.body;

    if (!period || !status || !Array.isArray(goals)) {
      return res.status(400).json({ error: 'Missing period, status, or valid goals array' });
    }

    // 1. Check if a submission for this period already exists
    let submissionResult = await query(
      'SELECT id, status FROM public.goal_submissions WHERE user_id = $1 AND period = $2',
      [userId, period]
    );

    let submissionId;

    if (submissionResult.rows.length > 0) {
      const existingSubmission = submissionResult.rows[0];
      submissionId = existingSubmission.id;
      const currentStatus = existingSubmission.status;

      // Status transition validation
      if (currentStatus === 'approved') {
        return res.status(403).json({ error: 'Cannot modify approved goals.' });
      }

      if (currentStatus === 'pending_approval') {
        return res.status(403).json({ error: 'Cannot modify goals currently pending approval.' });
      }

      const isValidTransition = 
        (currentStatus === 'draft' && (status === 'draft' || status === 'pending_approval')) ||
        (currentStatus === 'rejected' && (status === 'draft' || status === 'pending_approval'));

      if (!isValidTransition) {
        return res.status(400).json({ error: `Invalid status transition from ${currentStatus} to ${status}` });
      }

      await query(
        'UPDATE public.goal_submissions SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, submissionId]
      );

      // Delete existing goals for this submission to replace them
      await query(
        'DELETE FROM public.goals WHERE submission_id = $1',
        [submissionId]
      );
    } else {
      // Create new submission
      submissionResult = await query(
        `INSERT INTO public.goal_submissions (user_id, period, status) 
         VALUES ($1, $2, $3) RETURNING id`,
        [userId, period, status]
      );
      submissionId = submissionResult.rows[0].id;
    }

    // 2. Insert new goals linked to the submission_id
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
          goal.target_value || 0,
          goal.weightage || 0
        );
      }

      const insertQuery = `
        INSERT INTO public.goals (submission_id, thrust_area, goal_title, description, uom_type, measurement_type, target_value, weightage)
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `;

      const insertResult = await query(insertQuery, values);
      return res.status(201).json({ 
        submission_id: submissionId, 
        status, 
        goals: insertResult.rows, 
        message: 'Goals submitted successfully' 
      });
    }

    res.json({ submission_id: submissionId, status, goals: [], message: 'Submission saved with no goals' });
  } catch (error) {
    console.error('Error submitting goals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

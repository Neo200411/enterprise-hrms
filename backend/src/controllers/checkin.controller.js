import { query } from '../config/db.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROGRESS_STATUSES = ['Not Started', 'On Track', 'In Progress', 'Blocked', 'Completed'];

// Employee: Get approved goals and their check-ins for a quarter
export const getMyCheckins = async (req, res) => {
  try {
    const userId = req.user.id;
    const quarter = req.query.quarter;

    const ALLOWED_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
    if (!quarter || !ALLOWED_QUARTERS.includes(quarter)) {
      return res.status(400).json({ error: 'Quarter is required and must be one of Q1, Q2, Q3, Q4' });
    }

    // Fetch approved goals
    const goalsResult = await query(
      `SELECT g.id, g.thrust_area, g.goal_title, g.description, g.uom_type, g.target_value, g.weightage, g.measurement_type, gs.period
       FROM public.goals g
       JOIN public.goal_submissions gs ON g.submission_id = gs.id
       WHERE gs.user_id = $1 AND gs.status = 'approved'
       ORDER BY g.thrust_area ASC`,
      [userId]
    );

    if (goalsResult.rows.length === 0) {
      return res.json({ goals: [], checkins: [] });
    }

    const goalIds = goalsResult.rows.map(g => g.id);

    // Fetch check-ins for these goals and the specific quarter
    const checkinsResult = await query(
      `SELECT * FROM public.goal_checkins 
       WHERE goal_id = ANY($1::uuid[]) AND quarter = $2`,
      [goalIds, quarter]
    );

    res.json({
      goals: goalsResult.rows,
      checkins: checkinsResult.rows
    });
  } catch (error) {
    console.error('Error fetching employee checkins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Employee: Upsert a check-in
export const submitCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal_id, quarter, actual_achievement, progress_status } = req.body;

    if (!goal_id || !quarter || !progress_status) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ALLOWED_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
    if (!ALLOWED_QUARTERS.includes(quarter)) {
      return res.status(400).json({ error: 'Quarter must be one of Q1, Q2, Q3, Q4' });
    }

    if (!UUID_RE.test(goal_id)) {
      return res.status(400).json({ error: 'Invalid goal ID' });
    }

    if (!PROGRESS_STATUSES.includes(progress_status)) {
      return res.status(400).json({ error: `Progress status must be one of: ${PROGRESS_STATUSES.join(', ')}` });
    }

    if (actual_achievement != null && !(Number(actual_achievement) >= 0)) {
      return res.status(400).json({ error: 'Actual achievement must be a number of 0 or more' });
    }

    // 1. Strict Validation: Ensure the goal belongs to the user AND the parent submission is 'approved'
    const authCheck = await query(
      `SELECT g.id 
       FROM public.goals g
       JOIN public.goal_submissions gs ON g.submission_id = gs.id
       WHERE g.id = $1 AND gs.user_id = $2 AND gs.status = 'approved'`,
      [goal_id, userId]
    );

    if (authCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Goal is either not approved or does not belong to you.' });
    }

    // 2. Upsert check-in
    const upsertResult = await query(
      `INSERT INTO public.goal_checkins (goal_id, quarter, actual_achievement, progress_status)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (goal_id, quarter) 
       DO UPDATE SET 
         actual_achievement = EXCLUDED.actual_achievement, 
         progress_status = EXCLUDED.progress_status, 
         updated_at = NOW()
       RETURNING id, goal_id, quarter, actual_achievement, progress_status`,
      [goal_id, quarter, actual_achievement ?? null, progress_status]
    );

    res.json({ checkin: upsertResult.rows[0], message: 'Check-in saved successfully.' });
  } catch (error) {
    console.error('Error saving checkin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Manager: Get team check-ins
export const getTeamCheckins = async (req, res) => {
  try {
    // Note: If you want to limit to specific teams, you would add an organizational join here.
    // Assuming manager can see all approved goals for now.
    const quarter = req.query.quarter;

    const ALLOWED_QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
    if (!quarter || !ALLOWED_QUARTERS.includes(quarter)) {
      return res.status(400).json({ error: 'Quarter is required and must be one of Q1, Q2, Q3, Q4' });
    }

    // Fetch ALL approved goals with employee details
    const goalsResult = await query(
      `SELECT g.id, g.thrust_area, g.goal_title, g.description, g.uom_type, g.target_value, g.weightage, g.measurement_type,
              gs.user_id as employee_id, u.name as employee_name, u.email as employee_email
       FROM public.goals g
       JOIN public.goal_submissions gs ON g.submission_id = gs.id
       JOIN public.users u ON gs.user_id = u.id
       WHERE gs.status = 'approved'
       ORDER BY u.name ASC, g.thrust_area ASC`
    );

    if (goalsResult.rows.length === 0) {
      return res.json({ goals: [], checkins: [] });
    }

    const goalIds = goalsResult.rows.map(g => g.id);

    // Fetch associated check-ins
    const checkinsResult = await query(
      `SELECT * FROM public.goal_checkins 
       WHERE goal_id = ANY($1::uuid[]) AND quarter = $2`,
      [goalIds, quarter]
    );

    res.json({
      goals: goalsResult.rows,
      checkins: checkinsResult.rows
    });
  } catch (error) {
    console.error('Error fetching team checkins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import { query } from '../config/db.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PROGRESS_STATUSES = ['Not Started', 'On Track', 'In Progress', 'Blocked', 'Completed'];
const MAX_BLOCKER_NOTE = 500;

// Goals are planned per period ("Q4 2026"), so each goal is checked in once — for its own quarter.
const quarterOf = (period) => String(period).split(' ')[0];

// Newest period first: "Q1 2027" before "Q4 2026"
const sortPeriods = (periods) => {
  const key = (p) => {
    const match = /^Q([1-4]) (\d{4})$/.exec(p);
    return match ? Number(match[2]) * 10 + Number(match[1]) : 0;
  };
  return [...periods].sort((a, b) => key(b) - key(a));
};

// Shared by the employee and manager views: pick the period, load its approved goals and their check-ins
const loadCheckins = async ({ requestedPeriod, userId }) => {
  const ownerFilter = userId ? 'AND gs.user_id = $1' : '';
  const ownerParams = userId ? [userId] : [];

  const periodsResult = await query(
    `SELECT DISTINCT gs.period FROM public.goal_submissions gs
     WHERE gs.status = 'approved' ${ownerFilter}`,
    ownerParams
  );
  const periods = sortPeriods(periodsResult.rows.map(r => r.period));

  // Default to the most recent period with approved goals
  const period = periods.includes(requestedPeriod) ? requestedPeriod : periods[0];
  if (!period) {
    return { periods: [], period: null, goals: [], checkins: [] };
  }

  const goalsResult = await query(
    `SELECT g.id, g.thrust_area, g.goal_title, g.description, g.uom_type, g.target_value, g.weightage, g.measurement_type,
            gs.period, gs.user_id AS employee_id, u.name AS employee_name, u.email AS employee_email
     FROM public.goals g
     JOIN public.goal_submissions gs ON g.submission_id = gs.id
     JOIN public.users u ON gs.user_id = u.id
     WHERE gs.status = 'approved' AND gs.period = $${ownerParams.length + 1} ${ownerFilter}
     ORDER BY u.name ASC, g.thrust_area ASC`,
    [...ownerParams, period]
  );

  const goalIds = goalsResult.rows.map(g => g.id);
  const checkinsResult = goalIds.length
    ? await query('SELECT * FROM public.goal_checkins WHERE goal_id = ANY($1::uuid[]) AND quarter = $2', [goalIds, quarterOf(period)])
    : { rows: [] };

  return { periods, period, goals: goalsResult.rows, checkins: checkinsResult.rows };
};

// Employee: their approved goals and check-ins for one period (?period=Q4 2026; defaults to the latest)
export const getMyCheckins = async (req, res) => {
  try {
    res.json(await loadCheckins({ requestedPeriod: req.query.period, userId: req.user.id }));
  } catch (error) {
    console.error('Error fetching employee checkins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Manager: everyone's approved goals and check-ins for one period
export const getTeamCheckins = async (req, res) => {
  try {
    res.json(await loadCheckins({ requestedPeriod: req.query.period }));
  } catch (error) {
    console.error('Error fetching team checkins:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Employee: save (or update) the check-in for one goal
export const submitCheckin = async (req, res) => {
  try {
    const userId = req.user.id;
    const { goal_id, actual_achievement, progress_status } = req.body;
    // A reason is required when a goal is blocked, and cleared otherwise
    const blockerNote = progress_status === 'Blocked' ? String(req.body.blocker_note || '').trim() : null;

    if (!goal_id || !progress_status) {
      return res.status(400).json({ error: 'Missing required fields' });
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

    if (progress_status === 'Blocked' && !blockerNote) {
      return res.status(400).json({ error: 'Please explain what is blocking this goal' });
    }

    if (blockerNote && blockerNote.length > MAX_BLOCKER_NOTE) {
      return res.status(400).json({ error: `Blocker reason must be ${MAX_BLOCKER_NOTE} characters or fewer` });
    }

    // The goal must belong to this user and be approved; its period decides the quarter
    const goalResult = await query(
      `SELECT gs.period
       FROM public.goals g
       JOIN public.goal_submissions gs ON g.submission_id = gs.id
       WHERE g.id = $1 AND gs.user_id = $2 AND gs.status = 'approved'`,
      [goal_id, userId]
    );

    if (goalResult.rows.length === 0) {
      return res.status(403).json({ error: 'Goal is either not approved or does not belong to you.' });
    }

    const quarter = quarterOf(goalResult.rows[0].period);

    // Insert, or update if this goal already has a check-in
    const upsertResult = await query(
      `INSERT INTO public.goal_checkins (goal_id, quarter, actual_achievement, progress_status, blocker_note)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (goal_id, quarter)
       DO UPDATE SET
         actual_achievement = EXCLUDED.actual_achievement,
         progress_status = EXCLUDED.progress_status,
         blocker_note = EXCLUDED.blocker_note,
         updated_at = NOW()
       RETURNING id, goal_id, quarter, actual_achievement, progress_status, blocker_note`,
      [goal_id, quarter, actual_achievement ?? null, progress_status, blockerNote]
    );

    res.json({ checkin: upsertResult.rows[0], message: 'Check-in saved successfully.' });
  } catch (error) {
    console.error('Error saving checkin:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

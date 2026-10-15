import { query } from '../config/db.js';

export const getAllEmployees = async (req, res) => {
  try {
    const employeesResult = await query(`
      SELECT 
        u.id, 
        COALESCE(u.name, split_part(u.email, '@', 1)) as name, 
        u.email, 
        u.role,
        LEAST(ROUND(COALESCE(AVG(LEAST(gc.actual_achievement / NULLIF(g.target_value, 0) * 100, 100)), 0)), 100)::int as performance_score,
        COUNT(DISTINCT CASE WHEN gs.status = 'approved' THEN g.id END)::int as active_goals,
        MAX(COALESCE(gc.created_at, gs.created_at, u.created_at)) as latest_activity
      FROM public.users u
      LEFT JOIN public.goal_submissions gs ON gs.user_id = u.id
      LEFT JOIN public.goals g ON g.submission_id = gs.id
      LEFT JOIN public.goal_checkins gc ON gc.goal_id = g.id
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY u.name ASC
    `);

    const employees = employeesResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      performanceScore: row.performance_score,
      activeGoals: row.active_goals,
      latestActivity: row.latest_activity
    }));

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

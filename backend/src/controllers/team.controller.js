import { query } from '../config/db.js';

export const getTeamMembers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const teamQuery = `
      SELECT 
        u.id as employee_id,
        COALESCE(u.name, split_part(u.email, '@', 1)) as employee_name,
        u.email as employee_email,
        u.role as role,
        COUNT(DISTINCT CASE WHEN gs.status = 'approved' THEN g.id END)::int as active_goals_count,
        COUNT(DISTINCT CASE WHEN gs.status = 'approved' AND LOWER(gc.progress_status) = 'completed' THEN g.id END)::int as completed_goals_count,
        COUNT(DISTINCT CASE WHEN gs.status IN ('draft', 'pending_approval', 'rejected') THEN g.id END)::int as pending_goals_count,
        MAX(gc.quarter) as latest_checkin_quarter,
        LEAST(ROUND(COALESCE(AVG(LEAST(gc.actual_achievement / NULLIF(g.target_value, 0) * 100, 100)), 0)), 100)::int as performance_score
      FROM public.users u
      LEFT JOIN public.goal_submissions gs ON gs.user_id = u.id
      LEFT JOIN public.goals g ON g.submission_id = gs.id
      LEFT JOIN public.goal_checkins gc ON gc.goal_id = g.id
      WHERE u.role IN ('employee', 'manager')
      GROUP BY u.id, u.name, u.email, u.role
      ORDER BY employee_name ASC
      LIMIT $1 OFFSET $2
    `;

    const result = await query(teamQuery, [limit, offset]);
    
    // Also get total count for pagination metadata
    const countQuery = `
      SELECT COUNT(id)::int as total
      FROM public.users
      WHERE role IN ('employee', 'manager')
    `;
    const countResult = await query(countQuery);
    const total = countResult.rows[0].total;

    res.json({
      data: result.rows,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

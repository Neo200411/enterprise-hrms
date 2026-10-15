import { query } from '../config/db.js';

export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    const [
      metricsResult,
      latestSubmissionResult,
      recentCheckinsResult
    ] = await Promise.all([
      // 1. Core Metrics & Performance Score
      query(`
        SELECT 
          COUNT(DISTINCT CASE WHEN gs.status = 'approved' THEN g.id END)::int as active_goals,
          COUNT(DISTINCT CASE WHEN gs.status = 'approved' AND LOWER(gc.progress_status) = 'completed' THEN g.id END)::int as completed_goals,
          COUNT(DISTINCT CASE WHEN gs.status = 'pending_approval' THEN g.id END)::int as pending_goals,
          LEAST(ROUND(COALESCE(AVG(LEAST(gc.actual_achievement / NULLIF(g.target_value, 0) * 100, 100)), 0)), 100)::int as performance_score
        FROM public.goal_submissions gs
        LEFT JOIN public.goals g ON g.submission_id = gs.id
        LEFT JOIN public.goal_checkins gc ON gc.goal_id = g.id
        WHERE gs.user_id = $1
      `, [userId]),

      // 2. Latest Submission Status
      query(`
        SELECT status
        FROM public.goal_submissions
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `, [userId]),

      // 3. Recent Checkins (Latest 5)
      query(`
        SELECT 
          gc.id,
          gc.goal_id,
          g.goal_title as goal_title,
          gc.quarter,
          gc.actual_achievement,
          LEAST(ROUND(COALESCE(gc.actual_achievement / NULLIF(g.target_value, 0) * 100, 0)), 100)::int as achievement_pct,
          CASE 
            WHEN LOWER(gc.progress_status) = 'completed' THEN 'Completed'
            WHEN LOWER(gc.progress_status) IN ('in progress', 'in_progress', 'on track', 'on_track') THEN 'In Progress'
            WHEN LOWER(gc.progress_status) = 'blocked' THEN 'Blocked'
            ELSE 'Pending'
          END as progress_status,
          gc.created_at
        FROM public.goal_checkins gc
        JOIN public.goals g ON g.id = gc.goal_id
        JOIN public.goal_submissions gs ON gs.id = g.submission_id
        WHERE gs.user_id = $1
        ORDER BY gc.created_at DESC
        LIMIT 5
      `, [userId])
    ]);

    const metrics = metricsResult.rows[0] || {
      active_goals: 0,
      completed_goals: 0,
      pending_goals: 0,
      performance_score: 0
    };

    const latestSubmissionStatus = latestSubmissionResult.rows[0]?.status || null;

    res.json({
      activeGoals: metrics.active_goals,
      completedGoals: metrics.completed_goals,
      pendingGoals: metrics.pending_goals,
      performanceScore: metrics.performance_score,
      latestSubmissionStatus,
      recentCheckins: recentCheckinsResult.rows
    });
  } catch (error) {
    console.error('Error fetching employee dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

import { query } from '../config/db.js';

// Get all metrics for the Admin Dashboard
export const getDashboardMetrics = async (req, res) => {
  try {
    // We execute these independently using Promise.all for maximum performance.
    const [
      usersResult,
      statusResult,
      checkinResult,
      qoqResult,
      thrustResult,
      managerResult,
      escalatedResult,
      activityResult
    ] = await Promise.all([
      // 1. Total Employees
      query("SELECT COUNT(*)::int as count FROM public.users WHERE role = 'employee'"),

      // 2. Goal Status Breakdown (Draft, Pending, Approved, Rejected)
      query(`
        SELECT gs.status as name, COUNT(g.id)::int as value
        FROM public.goals g
        JOIN public.goal_submissions gs ON g.submission_id = gs.id
        GROUP BY gs.status
      `),

      // 3. Check-in Completion
      query(`
        SELECT 
          COUNT(DISTINCT g.id)::int AS total_approved_goals,
          COUNT(DISTINCT gc.goal_id)::int AS goals_with_checkins
        FROM public.goals g
        JOIN public.goal_submissions gs ON g.submission_id = gs.id AND gs.status = 'approved'
        LEFT JOIN public.goal_checkins gc ON g.id = gc.goal_id
      `),

      // 4. QoQ Trend
      query(`
        SELECT 
          gc.quarter,
          SUM(gc.actual_achievement) as sum_actual,
          SUM(g.target_value) as sum_target
        FROM public.goal_checkins gc
        JOIN public.goals g ON gc.goal_id = g.id
        GROUP BY gc.quarter
        ORDER BY 
          CASE gc.quarter
            WHEN 'Q1' THEN 1
            WHEN 'Q2' THEN 2
            WHEN 'Q3' THEN 3
            WHEN 'Q4' THEN 4
            ELSE 5
          END
      `),

      // 5. Thrust Data
      query(`
        SELECT g.thrust_area as name, COUNT(g.id)::int as value
        FROM public.goals g
        GROUP BY g.thrust_area
      `),

      // 6. Manager Effectiveness
      query(`
        SELECT 
          AVG(EXTRACT(EPOCH FROM (a.created_at - gs.created_at))/3600) as avg_approval_hours,
          AVG(LENGTH(a.remarks)) as avg_remark_length,
          SUM(CASE WHEN a.approval_action = 'rejected' THEN 1 ELSE 0 END)::numeric / NULLIF(COUNT(a.id), 0) * 100 as rework_rate_pct
        FROM public.approvals a
        JOIN public.goal_submissions gs ON a.submission_id = gs.id
      `),

      // 7. Escalated Goals (> 7 days pending)
      query(`
        SELECT 
          g.id,
          g.goal_title as title,
          COALESCE(u.name, split_part(u.email, '@', 1)) as employee,
          EXTRACT(DAY FROM (NOW() - gs.created_at))::int as "ageDays"
        FROM public.goals g
        JOIN public.goal_submissions gs ON g.submission_id = gs.id
        JOIN public.users u ON gs.user_id = u.id
        WHERE gs.status = 'pending_approval' 
          AND gs.created_at < NOW() - INTERVAL '7 days'
      `),

      // 8. Recent Activity
      query(`
        SELECT 
          a.id,
          (SELECT goal_title FROM public.goals WHERE submission_id = gs.id LIMIT 1) || 
            CASE WHEN (SELECT COUNT(*) FROM public.goals WHERE submission_id = gs.id) > 1 
                 THEN ' (+' || ((SELECT COUNT(*) FROM public.goals WHERE submission_id = gs.id) - 1) || ' more)' 
                 ELSE '' END as goal_title,
          COALESCE(u.name, split_part(u.email, '@', 1)) as reviewer_name,
          a.approval_action as action,
          a.created_at
        FROM public.approvals a
        JOIN public.goal_submissions gs ON a.submission_id = gs.id
        JOIN public.users u ON a.manager_id = u.id
        ORDER BY a.created_at DESC
        LIMIT 5
      `)
    ]);

    // -- Map status results to KPI counts --
    let totalGoals = 0, approvedGoals = 0, pendingGoals = 0;
    const statusColorMap = {
      'draft': '#64748b',
      'pending_approval': '#f59e0b',
      'approved': '#10b981',
      'rejected': '#ef4444'
    };
    const statusNameMap = {
      'draft': 'Draft',
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'rejected': 'Needs Revision'
    };

    const statusData = statusResult.rows.map(row => {
      totalGoals += row.value;
      if (row.name === 'approved') approvedGoals = row.value;
      if (row.name === 'pending_approval') pendingGoals = row.value;

      return {
        name: statusNameMap[row.name] || row.name,
        value: row.value,
        fill: statusColorMap[row.name] || '#94a3b8'
      };
    });

    // -- Checkin Completion --
    const checkinStats = checkinResult.rows[0] || { total_approved_goals: 0, goals_with_checkins: 0 };
    const checkinCompletionPct = checkinStats.total_approved_goals > 0 
      ? Math.round((checkinStats.goals_with_checkins / checkinStats.total_approved_goals) * 100) 
      : 0;

    // -- QoQ Trend --
    // Calculate achievement rates and map to the format frontend expects
    const computedQoq = qoqResult.rows.map(row => {
      const rate = row.sum_target > 0 ? Math.round((row.sum_actual / row.sum_target) * 100) : 0;
      return {
        quarter: row.quarter,
        achievementRate: Math.min(100, rate),
        target: 100
      };
    });

    // -- Manager KPIs --
    const mKpi = managerResult.rows[0] || {};
    const managerKpis = {
      avgApprovalTimeHours: mKpi.avg_approval_hours ? Number(mKpi.avg_approval_hours).toFixed(1) : '0.0',
      avgRemarkLength: mKpi.avg_remark_length ? Math.round(Number(mKpi.avg_remark_length)) : 0,
      reworkRatePct: mKpi.rework_rate_pct ? Math.round(Number(mKpi.rework_rate_pct)) : 0
    };

    res.json({
      kpis: {
        totalEmployees: usersResult.rows[0]?.count || 0,
        totalGoals,
        approvedGoals,
        pendingGoals,
        checkinCompletionPct
      },
      statusData,
      qoqTrend: computedQoq,
      thrustData: thrustResult.rows,
      managerKpis,
      escalatedGoals: escalatedResult.rows,
      recentActivity: activityResult.rows
    });
  } catch (error) {
    console.error('Error fetching analytics metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export Goals to CSV Format
export const exportGoalsData = async (req, res) => {
  try {
    const exportQuery = await query(`
      SELECT 
        g.goal_title,
        g.thrust_area,
        g.uom_type,
        g.target_value,
        gc.actual_achievement,
        g.weightage,
        gs.status as goal_status,
        gc.quarter,
        COALESCE(gc.progress_status, 'No check-in') as progress_status,
        g.created_at
      FROM public.goals g
      JOIN public.goal_submissions gs ON g.submission_id = gs.id
      LEFT JOIN public.goal_checkins gc ON g.id = gc.goal_id
      ORDER BY g.created_at DESC
    `);

    res.json({ data: exportQuery.rows });
  } catch (error) {
    console.error('Error exporting goals data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Manager Dashboard Metrics
export const getManagerDashboard = async (req, res) => {
  try {
    const [
      teamCountResult,
      goalsCountResult,
      pendingCountResult,
      performanceResult,
      statusResult
    ] = await Promise.all([
      query(`SELECT COUNT(*)::int as count FROM public.users WHERE role IN ('employee', 'manager')`),
      
      query(`SELECT COUNT(*)::int as count FROM public.goals g JOIN public.goal_submissions gs ON g.submission_id = gs.id WHERE gs.status = 'approved'`),
      
      query(`SELECT COUNT(*)::int as count FROM public.goal_submissions WHERE status = 'pending_approval'`),
      
      query(`
        WITH user_scores AS (
          SELECT 
            u.id,
            COALESCE(AVG(gc.actual_achievement), 0) as avg_score
          FROM public.users u
          LEFT JOIN public.goal_submissions gs ON gs.user_id = u.id AND gs.status = 'approved'
          LEFT JOIN public.goals g ON g.submission_id = gs.id
          LEFT JOIN public.goal_checkins gc ON gc.goal_id = g.id
          WHERE u.role IN ('employee', 'manager')
          GROUP BY u.id
        )
        SELECT 
          ROUND(AVG(avg_score))::int as team_score,
          SUM(CASE WHEN avg_score >= 90 THEN 1 ELSE 0 END)::int as excellent_count,
          SUM(CASE WHEN avg_score >= 80 AND avg_score < 90 THEN 1 ELSE 0 END)::int as good_count,
          SUM(CASE WHEN avg_score < 80 THEN 1 ELSE 0 END)::int as needs_improvement_count
        FROM user_scores
      `),
      
      query(`
        SELECT 
          CASE 
            WHEN LOWER(gc.progress_status) = 'completed' THEN 'Completed'
            WHEN LOWER(gc.progress_status) IN ('in progress', 'in_progress') THEN 'In Progress'
            WHEN LOWER(gc.progress_status) = 'blocked' THEN 'Blocked'
            ELSE 'Pending'
          END as status,
          COUNT(g.id)::int as count
        FROM public.goals g
        JOIN public.goal_submissions gs ON g.submission_id = gs.id AND gs.status = 'approved'
        LEFT JOIN public.goal_checkins gc ON gc.goal_id = g.id
        GROUP BY 1
      `)
    ]);

    const teamMembers = teamCountResult.rows[0]?.count || 0;
    const activeGoals = goalsCountResult.rows[0]?.count || 0;
    const approvalsPending = pendingCountResult.rows[0]?.count || 0;
    
    const perfData = performanceResult.rows[0] || { team_score: 0, excellent_count: 0, good_count: 0, needs_improvement_count: 0 };
    const teamScore = perfData.team_score || 0;
    const totalScoredMembers = perfData.excellent_count + perfData.good_count + perfData.needs_improvement_count;
    
    const getPct = (count) => totalScoredMembers > 0 ? Math.round((count / totalScoredMembers) * 100) : 0;
    
    const performanceDistribution = [
      { label: 'Excellent (90-100%)', count: perfData.excellent_count, percentage: getPct(perfData.excellent_count), color: 'bg-status-success' },
      { label: 'Good (80-89%)', count: perfData.good_count, percentage: getPct(perfData.good_count), color: 'bg-primary' },
      { label: 'Needs Improvement (<80%)', count: perfData.needs_improvement_count, percentage: getPct(perfData.needs_improvement_count), color: 'bg-status-pending' }
    ];

    // Ensure all 4 requested canonical statuses are returned even if count is 0
    const rawStatusCounts = statusResult.rows.reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    const goalStatusBreakdown = [
      { status: 'In Progress', count: rawStatusCounts['In Progress'] || 0, color: 'bg-primary' },
      { status: 'Completed', count: rawStatusCounts['Completed'] || 0, color: 'bg-status-success' },
      { status: 'Pending', count: rawStatusCounts['Pending'] || 0, color: 'bg-status-pending' },
      { status: 'Blocked', count: rawStatusCounts['Blocked'] || 0, color: 'bg-destructive' }
    ];

    res.json({
      teamMembers,
      activeGoals,
      approvalsPending,
      teamScore,
      performanceDistribution,
      goalStatusBreakdown
    });
  } catch (error) {
    console.error('Error fetching manager dashboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


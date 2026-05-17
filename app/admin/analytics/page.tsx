'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import {
  Users, Target, CheckCircle2, Clock, TrendingUp, AlertCircle, Download,
} from 'lucide-react'
import { toCsv, downloadCsv } from '@/lib/export'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

// --- Static chart data (kept as-is) ---
const performanceData = [
  { month: 'Jan', performance: 72, target: 80 },
  { month: 'Feb', performance: 75, target: 80 },
  { month: 'Mar', performance: 78, target: 80 },
  { month: 'Apr', performance: 82, target: 80 },
  { month: 'May', performance: 85, target: 85 },
  { month: 'Jun', performance: 88, target: 85 },
  { month: 'Jul', performance: 87, target: 85 },
  { month: 'Aug', performance: 90, target: 90 },
]

const goalChartData = [
  { quarter: 'Q1', completed: 24, inProgress: 18, pending: 8 },
  { quarter: 'Q2', completed: 32, inProgress: 22, pending: 6 },
  { quarter: 'Q3', completed: 38, inProgress: 24, pending: 5 },
  { quarter: 'Q4', completed: 42, inProgress: 28, pending: 4 },
]

// --- Types ---
interface KPIs {
  totalEmployees: number
  totalGoals: number
  approvedGoals: number
  pendingGoals: number
  checkinCompletionPct: number
}

interface ActivityRow {
  id: string
  goal_id: string
  reviewer_id: string
  action: string
  created_at: string
  goal_title?: string
  reviewer_name?: string
}

function StatCard({
  label, value, icon: Icon, color, loading,
}: { label: string; value: string | number; icon: any; color: string; loading: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {loading ? (
          <div className="h-7 w-16 mt-1 rounded bg-secondary animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-foreground">{value}</p>
        )}
      </div>
    </div>
  )
}

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<KPIs>({ totalEmployees: 0, totalGoals: 0, approvedGoals: 0, pendingGoals: 0, checkinCompletionPct: 0 })
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        // Parallel fetches
        const [
          { count: empCount },
          { count: totalGoals },
          { count: approvedGoals },
          { count: pendingGoals },
          { data: checkins },
          { data: allGoals },
          { data: approvals },
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
          supabase.from('goals').select('*', { count: 'exact', head: true }),
          supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
          supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'pending_approval'),
          supabase.from('goal_checkins').select('goal_id'),
          supabase.from('goals').select('id').eq('status', 'approved'),
          supabase.from('approvals').select('id, goal_id, manager_id, approval_action, created_at').order('created_at', { ascending: false }).limit(10),
        ])

        const approvedGoalIds = new Set((allGoals || []).map((g: any) => g.id))
        const checkedGoalIds = new Set((checkins || []).map((c: any) => c.goal_id))
        const checkedApproved = [...checkedGoalIds].filter(id => approvedGoalIds.has(id)).length
        const pct = approvedGoalIds.size > 0 ? Math.round((checkedApproved / approvedGoalIds.size) * 100) : 0

        setKpis({
          totalEmployees: empCount || 0,
          totalGoals: totalGoals || 0,
          approvedGoals: approvedGoals || 0,
          pendingGoals: pendingGoals || 0,
          checkinCompletionPct: pct,
        })

        // Enrich approvals with goal titles and manager names
        if (approvals && approvals.length > 0) {
          const goalIds = [...new Set(approvals.map((a: any) => a.goal_id))]
          const managerIds = [...new Set(approvals.map((a: any) => a.manager_id))]

          const [{ data: goalTitles }, { data: managers }] = await Promise.all([
            supabase.from('goals').select('id, goal_title').in('id', goalIds),
            supabase.from('users').select('id, name, email').in('id', managerIds),
          ])

          const goalMap: Record<string, string> = {}
          for (const g of (goalTitles || [])) goalMap[g.id] = g.goal_title

          const managerMap: Record<string, string> = {}
          for (const u of (managers || [])) managerMap[u.id] = u.name || u.email

          setActivity(approvals.map((a: any) => ({
            ...a,
            action: a.approval_action,
            goal_title: goalMap[a.goal_id] || 'Unknown Goal',
            reviewer_name: managerMap[a.manager_id] || 'Manager',
          })))
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const actionBadge = (action: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      rework: 'bg-amber-100 text-amber-700',
    }
    return styles[action] || 'bg-gray-100 text-gray-600'
  }

  const handleExportGoals = async () => {
    const { data: goals } = await supabase
      .from('goals')
      .select('id, thrust_area, goal_title, uom_type, target_value, weightage, status, created_at')
      .order('created_at', { ascending: false })
    const { data: checkins } = await supabase.from('goal_checkins').select('*')
    const checkinMap: Record<string, any[]> = {}
    for (const c of (checkins || [])) {
      if (!checkinMap[c.goal_id]) checkinMap[c.goal_id] = []
      checkinMap[c.goal_id].push(c)
    }
    const rows = (goals || []).flatMap((g: any) => {
      const gCheckins = checkinMap[g.id]
      if (gCheckins && gCheckins.length > 0) {
        return gCheckins.map((c: any) => ({
          goal_title: g.goal_title, thrust_area: g.thrust_area, uom_type: g.uom_type,
          target_value: g.target_value, weightage: g.weightage, goal_status: g.status,
          quarter: c.quarter, actual_achievement: c.actual_achievement,
          progress_status: c.progress_status,
          created_at: new Date(g.created_at).toLocaleDateString(),
        }))
      }
      return [{ goal_title: g.goal_title, thrust_area: g.thrust_area, uom_type: g.uom_type,
        target_value: g.target_value, weightage: g.weightage, goal_status: g.status,
        quarter: '', actual_achievement: '', progress_status: 'No check-in',
        created_at: new Date(g.created_at).toLocaleDateString() }]
    })
    const columns = [
      { key: 'goal_title', label: 'Goal Title' },
      { key: 'thrust_area', label: 'Thrust Area' },
      { key: 'uom_type', label: 'UoM' },
      { key: 'target_value', label: 'Target' },
      { key: 'actual_achievement', label: 'Actual Achievement' },
      { key: 'weightage', label: 'Weightage (%)' },
      { key: 'goal_status', label: 'Goal Status' },
      { key: 'quarter', label: 'Quarter' },
      { key: 'progress_status', label: 'Progress Status' },
      { key: 'created_at', label: 'Created Date' },
    ]
    downloadCsv(toCsv(rows, columns), `goals-report-${Date.now()}.csv`)
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">Company-wide performance metrics and insights</p>
          </div>
          <button
            onClick={handleExportGoals}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Export Goals CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
          </div>
        )}

        {/* Live KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <StatCard label="Total Employees" value={kpis.totalEmployees} icon={Users} color="bg-blue-50 text-blue-600" loading={isLoading} />
          <StatCard label="Total Goals" value={kpis.totalGoals} icon={Target} color="bg-purple-50 text-purple-600" loading={isLoading} />
          <StatCard label="Approved Goals" value={kpis.approvedGoals} icon={CheckCircle2} color="bg-green-50 text-green-600" loading={isLoading} />
          <StatCard label="Pending Approvals" value={kpis.pendingGoals} icon={Clock} color="bg-amber-50 text-amber-600" loading={isLoading} />
          <StatCard label="Check-in Completion" value={`${kpis.checkinCompletionPct}%`} icon={TrendingUp} color="bg-cyan-50 text-cyan-600" loading={isLoading} />
        </div>

        {/* Recent Activity Table */}
        <DashboardCard title="Recent Approval Activity">
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-10 rounded-lg bg-secondary animate-pulse" />)}
            </div>
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No approval activity yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Goal</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Reviewed By</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2 pr-4">Action</th>
                    <th className="text-left text-xs font-medium text-muted-foreground pb-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {activity.map(row => (
                    <tr key={row.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-foreground">{row.goal_title}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{row.reviewer_name}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${actionBadge(row.action)}`}>
                          {row.action}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs">
                        {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DashboardCard title="Performance Trend">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="performance" stroke="var(--chart-1)" strokeWidth={2} dot={{ fill: 'var(--chart-1)', r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="target" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'var(--chart-2)', r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </DashboardCard>

          <DashboardCard title="Goal Completion by Quarter">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={goalChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="quarter" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="completed" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="inProgress" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="pending" fill="var(--chart-5)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DashboardCard>
        </div>
      </div>
    </AppLayout>
  )
}

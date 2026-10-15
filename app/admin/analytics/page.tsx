'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import {
  Users, Target, CheckCircle2, Clock, TrendingUp, AlertCircle, Download, AlertTriangle, MessageSquare, ShieldAlert
} from 'lucide-react'
import { toCsv, downloadCsv } from '@/lib/export'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'

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
  goal_title: string
  reviewer_name: string
  action: string
  created_at: string
}

interface QoqTrend {
  quarter: string
  achievementRate: number
  target: number
}

interface ThrustData {
  name: string
  value: number
}

interface StatusData {
  name: string
  value: number
  fill: string
}

interface ManagerKPIs {
  avgApprovalTimeHours: string
  avgRemarkLength: number
  reworkRatePct: number
}

interface EscalatedGoal {
  id: string
  title: string
  employee: string
  ageDays: number
}

function StatCard({
  label, value, icon: Icon, color, loading,
}: { label: string; value: string | number; icon: any; color: string; loading: boolean }) {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground font-medium">{label}</p>
        {loading ? (
          <div className="h-7 w-16 mt-1 rounded bg-secondary animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
        )}
      </div>
    </div>
  )
}

const COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)']

export default function AnalyticsDashboard() {
  const [kpis, setKpis] = useState<KPIs>({ totalEmployees: 0, totalGoals: 0, approvedGoals: 0, pendingGoals: 0, checkinCompletionPct: 0 })
  const [activity, setActivity] = useState<ActivityRow[]>([])
  const [qoqTrend, setQoqTrend] = useState<QoqTrend[]>([])
  const [thrustData, setThrustData] = useState<ThrustData[]>([])
  const [statusData, setStatusData] = useState<StatusData[]>([])
  const [managerKpis, setManagerKpis] = useState<ManagerKPIs>({ avgApprovalTimeHours: '24.0', avgRemarkLength: 0, reworkRatePct: 0 })
  const [escalatedGoals, setEscalatedGoals] = useState<EscalatedGoal[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const dashboard = await api.getAnalyticsDashboard()
        
        if (dashboard.kpis) setKpis(dashboard.kpis)
        if (dashboard.statusData) setStatusData(dashboard.statusData)
        if (dashboard.qoqTrend) setQoqTrend(dashboard.qoqTrend)
        if (dashboard.thrustData) setThrustData(dashboard.thrustData)
        if (dashboard.managerKpis) setManagerKpis(dashboard.managerKpis)
        if (dashboard.escalatedGoals) setEscalatedGoals(dashboard.escalatedGoals)
        if (dashboard.recentActivity) setActivity(dashboard.recentActivity)

      } catch (err: any) {
        console.error(err)
        setError(err.message || 'Failed to load dashboard data.')
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  const actionBadge = (action: string) => {
    const styles: Record<string, string> = {
      approved: 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
      rework: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400',
    }
    return styles[action] || 'bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
  }

  const handleExportGoals = async () => {
    try {
      const exportResponse = await api.exportAnalytics()
      const exportData = exportResponse.data || []
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
      downloadCsv(toCsv(exportData, columns), `goals-report-${Date.now()}.csv`)
    } catch (err) {
      console.error('Export failed', err)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Analytics</h1>
            <p className="text-muted-foreground mt-1">Real-time performance distribution & pipeline escalation review</p>
          </div>
          <button
            onClick={handleExportGoals}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-colors flex-shrink-0"
          >
            <Download className="w-4 h-4" />
            Export Goals CSV
          </button>
        </div>

        {/* Dynamic Escalation Warnings Indicator panel */}
        {!isLoading && escalatedGoals.length > 0 && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-300 animate-in fade-in duration-300">
            <ShieldAlert className="w-5 h-5 flex-shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Escalation Warning: {escalatedGoals.length} Pending Approvals Exceeding 7 Days</h4>
              <div className="mt-2 space-y-1">
                {escalatedGoals.map(g => (
                  <p key={g.id} className="text-xs opacity-90">
                    ⚠️ Goal <span className="font-semibold">"{g.title}"</span> submitted by <span className="font-semibold">{g.employee}</span> is delayed by <span className="font-bold text-rose-600 dark:text-rose-400">{g.ageDays} days</span>.
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Live KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <StatCard label="Total Employees" value={kpis.totalEmployees} icon={Users} color="bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400" loading={isLoading} />
          <StatCard label="Total Goals" value={kpis.totalGoals} icon={Target} color="bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400" loading={isLoading} />
          <StatCard label="Approved Goals" value={kpis.approvedGoals} icon={CheckCircle2} color="bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400" loading={isLoading} />
          <StatCard label="Pending Approvals" value={kpis.pendingGoals} icon={Clock} color="bg-amber-50 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400" loading={isLoading} />
          <StatCard label="Check-in Completion" value={`${kpis.checkinCompletionPct}%`} icon={TrendingUp} color="bg-cyan-50 text-cyan-600 dark:bg-cyan-950/20 dark:text-cyan-400" loading={isLoading} />
        </div>

        {/* Manager Effectiveness Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>Avg Approval turnaround</span>
            </div>
            {isLoading ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded" />
            ) : (
              <div>
                <p className="text-2xl font-bold text-foreground">{managerKpis.avgApprovalTimeHours} Hours</p>
                <p className="text-xs text-muted-foreground mt-1">Average duration to process submitted goals</p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>Remark Depth Index</span>
            </div>
            {isLoading ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded" />
            ) : (
              <div>
                <p className="text-2xl font-bold text-foreground">{managerKpis.avgRemarkLength} Chars</p>
                <p className="text-xs text-muted-foreground mt-1">Average feedback remarks length given by managers</p>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>Goal Revision Index</span>
            </div>
            {isLoading ? (
              <div className="h-8 w-24 bg-secondary animate-pulse rounded" />
            ) : (
              <div>
                <p className="text-2xl font-bold text-foreground">{managerKpis.reworkRatePct}%</p>
                <p className="text-xs text-muted-foreground mt-1">Percentage of submissions needing revision</p>
              </div>
            )}
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QoQ line chart */}
          <DashboardCard title="QoQ Target Achievement Rate Trends">
            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="w-full h-full bg-secondary animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={qoqTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="quarter" stroke="var(--muted-foreground)" />
                    <YAxis unit="%" stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" name="Actual Performance Rate" dataKey="achievementRate" stroke="var(--chart-1)" strokeWidth={3} dot={{ fill: 'var(--chart-1)', r: 5 }} activeDot={{ r: 7 }} />
                    <Line type="monotone" name="Guidelines Target" dataKey="target" stroke="var(--chart-2)" strokeWidth={2} strokeDasharray="5 5" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>

          {/* Goal status distribution */}
          <DashboardCard title="Current Goal Status Breakdown">
            <div className="h-[280px] w-full flex items-center justify-center">
              {isLoading ? (
                <div className="w-full h-full bg-secondary animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>

          {/* Thrust area analytics */}
          <DashboardCard title="Goals by Core Thrust Area">
            <div className="h-[280px] w-full">
              {isLoading ? (
                <div className="w-full h-full bg-secondary animate-pulse rounded-lg" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={thrustData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                    <YAxis stroke="var(--muted-foreground)" />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                    <Bar dataKey="value" name="Goals Allocated" fill="var(--chart-3)" radius={[6, 6, 0, 0]}>
                      {thrustData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </DashboardCard>

          {/* Recent Approval Activity */}
          <DashboardCard title="Recent Review Trail">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 rounded-lg bg-secondary animate-pulse" />)}
              </div>
            ) : activity.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No recent review trail activities found.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="font-semibold text-muted-foreground pb-2 pr-4 text-xs">Goal Title</th>
                      <th className="font-semibold text-muted-foreground pb-2 pr-4 text-xs">Manager</th>
                      <th className="font-semibold text-muted-foreground pb-2 pr-4 text-xs">Decision</th>
                      <th className="font-semibold text-muted-foreground pb-2 text-xs">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activity.map(row => (
                      <tr key={row.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 pr-4 font-medium text-foreground max-w-[200px] truncate">{row.goal_title}</td>
                        <td className="py-3 pr-4 text-muted-foreground">{row.reviewer_name}</td>
                        <td className="py-3 pr-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${actionBadge(row.action)}`}>
                            {row.action}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {new Date(row.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </AppLayout>
  )
}

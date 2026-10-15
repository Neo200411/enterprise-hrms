'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { BarChart3, Users, CheckCircle2, AlertCircle, Clock, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/services/api'

interface PerformanceDistribution {
  label: string
  count: number
  percentage: number
  color: string
}

interface GoalStatusBreakdown {
  status: string
  count: number
  color: string
}

interface PendingApproval {
  id: string
  employee: string
  period: string
  goal_count: number
  submitted_at: string
}

interface BlockedGoal {
  id: string
  employee: string
  goal_title: string
  period: string
  blocker_note: string | null
  updated_at: string
}

interface ManagerDashboardMetrics {
  teamMembers: number
  activeGoals: number
  approvalsPending: number
  teamScore: number
  pendingApprovals: PendingApproval[]
  performanceDistribution: PerformanceDistribution[]
  goalStatusBreakdown: GoalStatusBreakdown[]
  blockedGoals: BlockedGoal[]
}

const daysSince = (date: string) => Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000))

const waitingLabel = (date: string) => {
  const days = daysSince(date)
  return days === 0 ? 'today' : days === 1 ? '1 day ago' : `${days} days ago`
}

export default function ManagerDashboard() {
  const [metrics, setMetrics] = useState<ManagerDashboardMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.getManagerDashboard()
      .then(setMetrics)
      .catch((err: any) => setError(err.message || 'Failed to load dashboard data.'))
      .finally(() => setIsLoading(false))
  }, [])

  const kpis = metrics ? [
    { title: 'Team Members', value: metrics.teamMembers, hint: 'People on your team', icon: Users, color: 'text-primary' },
    { title: 'Approved Goals', value: metrics.activeGoals, hint: 'Being worked on', icon: BarChart3, color: 'text-accent' },
    { title: 'Pending Approvals', value: metrics.approvalsPending, hint: 'Waiting for you', icon: Clock, color: 'text-status-pending' },
    { title: 'Team Score', value: `${metrics.teamScore}%`, hint: 'Average of checked-in goals', icon: CheckCircle2, color: 'text-status-success' },
  ] : []

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Manager Dashboard</h1>
        <p className="text-muted-foreground">What needs your attention, and how the team is doing</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-lg bg-secondary animate-pulse" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 rounded-lg bg-secondary animate-pulse" />
            <div className="h-64 rounded-lg bg-secondary animate-pulse" />
          </div>
        </div>
      ) : metrics && (
        <div className="space-y-8">
          {/* Key numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map(({ title, value, hint, icon: Icon, color }) => (
              <DashboardCard key={title} title={title}>
                <div className="flex items-end justify-between">
                  <div>
                    <p className={`text-4xl font-bold ${color}`}>{value}</p>
                    <p className="text-sm text-muted-foreground mt-2">{hint}</p>
                  </div>
                  <Icon className={`w-10 h-10 opacity-30 ${color}`} />
                </div>
              </DashboardCard>
            ))}
          </div>

          {/* Needs your attention */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title={`Waiting for Your Approval (${metrics.pendingApprovals.length})`}>
              {metrics.pendingApprovals.length ? (
                <div className="divide-y divide-border">
                  {metrics.pendingApprovals.map(item => (
                    <Link key={item.id} href="/approvals" className="py-3 flex items-center gap-3 hover:bg-secondary/40 -mx-2 px-2 rounded-lg transition-colors">
                      <Clock className={`w-5 h-5 flex-shrink-0 ${daysSince(item.submitted_at) > 7 ? 'text-destructive' : 'text-status-pending'}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">{item.employee}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.period} · {item.goal_count} {item.goal_count === 1 ? 'goal' : 'goals'} · submitted {waitingLabel(item.submitted_at)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">You're all caught up — nothing to approve.</p>
              )}
            </DashboardCard>

            <DashboardCard title={`Blocked Goals (${metrics.blockedGoals.length})`}>
              {metrics.blockedGoals.length ? (
                <div className="divide-y divide-border">
                  {metrics.blockedGoals.map(item => (
                    <Link key={item.id} href="/checkins-review" className="py-3 flex items-start gap-3 hover:bg-secondary/40 -mx-2 px-2 rounded-lg transition-colors">
                      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground">
                          {item.goal_title} <span className="font-normal text-muted-foreground">· {item.employee} · {item.period}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">“{item.blocker_note || 'No reason given'}”</p>
                      </div>
                      <p className="text-xs text-muted-foreground flex-shrink-0">{waitingLabel(item.updated_at)}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">No blocked goals — nobody on the team is stuck.</p>
              )}
            </DashboardCard>
          </div>

          {/* How the team is doing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DashboardCard title="Team Performance">
              {metrics.performanceDistribution.some(c => c.count > 0) ? (
                <div className="space-y-4">
                  {metrics.performanceDistribution.map(category => (
                    <div key={category.label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">{category.label}</span>
                        <span className="text-sm font-bold text-foreground">{category.count} {category.count === 1 ? 'person' : 'people'}</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div className={`${category.color} h-3 rounded-full transition-all duration-500`} style={{ width: `${category.percentage}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No check-ins yet — scores appear once your team records progress.</p>
              )}
            </DashboardCard>

            <DashboardCard title="Team Goal Status">
              <div className="grid grid-cols-2 gap-4">
                {metrics.goalStatusBreakdown.map(item => (
                  <div key={item.status} className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-3xl font-bold text-foreground mb-1">{item.count}</p>
                    <p className="text-sm text-muted-foreground">{item.status}</p>
                    <div className={`${item.color} h-1 rounded-full mt-3 w-full`} />
                  </div>
                ))}
              </div>
            </DashboardCard>
          </div>
        </div>
      )}
    </AppLayout>
  )
}

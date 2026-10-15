'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useEffect, useState } from 'react'
import { AlertCircle, FileText, CheckCircle2, Download, MessageCircle } from 'lucide-react'
import { toCsv, downloadCsv } from '@/lib/export'
import GoalForm from '@/components/goals/goal-form'
import { useAuth } from '@/components/providers/auth-provider'
import { api } from '@/services/api'
import { GoalItem } from '@/lib/validations/goal-schema'

type Status = 'draft' | 'pending_approval' | 'approved' | 'rejected'

interface Submission {
  period: string
  status: Status
  managerRemarks: string | null
  goals: GoalItem[]
}

const STATUS_COLORS: Record<Status, string> = {
  draft: 'bg-muted text-muted-foreground',
  pending_approval: 'bg-status-pending/10 text-status-pending',
  approved: 'bg-status-success/10 text-status-success',
  rejected: 'bg-destructive/10 text-destructive',
}

const STATUS_LABELS: Record<Status, string> = {
  draft: 'Draft',
  pending_approval: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Needs Revision',
}

export default function GoalsPage() {
  const { user } = useAuth()
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPlanningNew, setIsPlanningNew] = useState(false)

  const fetchSubmissions = async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const response = await api.getGoals()
      setSubmissions(
        (response.submissions || []).map((s: any) => ({
          period: s.period,
          status: s.status,
          managerRemarks: s.manager_remarks,
          goals: s.goals.map((g: any) => ({
            id: g.id,
            thrust_area: g.thrust_area,
            goal_title: g.goal_title,
            description: g.description,
            uom_type: g.uom_type,
            measurement_type: g.measurement_type,
            target_value: g.target_value,
            weightage: g.weightage,
          })),
        }))
      )
      setIsPlanningNew(false)
    } catch (err) {
      console.error('Error fetching goals:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmissions()
  }, [user])

  // A draft or a submission returned for rework is the one the employee can still edit
  const editable = submissions.find(s => s.status === 'draft' || s.status === 'rejected')
  const locked = submissions.filter(s => s !== editable)

  const handleExport = () => {
    const rows = submissions.flatMap(s =>
      s.goals.map(g => ({ ...g, period: s.period, status: STATUS_LABELS[s.status] }))
    )
    const columns = [
      { key: 'period', label: 'Period' },
      { key: 'status', label: 'Status' },
      { key: 'thrust_area', label: 'Thrust Area' },
      { key: 'goal_title', label: 'Goal Title' },
      { key: 'description', label: 'Description' },
      { key: 'uom_type', label: 'UoM Type' },
      { key: 'measurement_type', label: 'Measurement Type' },
      { key: 'target_value', label: 'Target Value' },
      { key: 'weightage', label: 'Weightage (%)' },
    ]
    downloadCsv(toCsv(rows, columns), `my-goals-${Date.now()}.csv`)
  }

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Goals</h1>
          <p className="text-muted-foreground">Track and manage your quarterly objectives</p>
        </div>
        <div className="flex gap-2">
          {submissions.length > 0 && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
          )}
          {/* Only one plan can be open for editing at a time */}
          {!isLoading && !editable && !isPlanningNew && submissions.length > 0 && (
            <button
              onClick={() => setIsPlanningNew(true)}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
            >
              Plan Next Period
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Editable plan: a draft, one returned for rework, a brand-new period, or the very first plan */}
          {editable ? (
            <div className="space-y-4">
              {editable.status === 'rejected' && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex gap-3">
                  <MessageCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Your manager returned these goals for rework</p>
                    <p className="text-sm text-muted-foreground mt-1">“{editable.managerRemarks || 'No remarks given'}”</p>
                  </div>
                </div>
              )}
              <GoalForm initialData={editable} onSuccess={fetchSubmissions} />
            </div>
          ) : (isPlanningNew || submissions.length === 0) && (
            <GoalForm
              initialData={null}
              usedPeriods={submissions.map(s => s.period)}
              onSuccess={fetchSubmissions}
              onCancel={submissions.length > 0 ? () => setIsPlanningNew(false) : undefined}
            />
          )}

          {/* Submitted plans (pending or approved) are read-only */}
          {locked.map(submission => (
            <div key={submission.period} className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
                <div className={`p-2 rounded-full ${submission.status === 'approved' ? 'bg-status-success/20 text-status-success' : 'bg-status-pending/20 text-status-pending'}`}>
                  {submission.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">Goal Submission - {submission.period}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Status:
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLORS[submission.status]}`}>
                      {STATUS_LABELS[submission.status]}
                    </span>
                  </p>
                  {submission.status === 'approved' && submission.managerRemarks && (
                    <p className="text-sm text-muted-foreground mt-1">Manager: “{submission.managerRemarks}”</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {submission.goals.map((goal, index) => (
                  <DashboardCard key={goal.id || index} title={`Goal #${index + 1}`}>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Thrust Area</p>
                        <p className="text-sm font-medium text-foreground">{goal.thrust_area}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Title</p>
                        <p className="text-sm text-foreground">{goal.goal_title}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase font-medium">Description</p>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border">
                        <div>
                          <p className="text-xs text-muted-foreground">Target</p>
                          <p className="text-sm font-medium text-foreground">
                            {goal.target_value} {goal.uom_type === 'Percentage' ? '%' : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Weightage</p>
                          <p className="text-sm font-bold text-primary">{goal.weightage}%</p>
                        </div>
                      </div>
                    </div>
                  </DashboardCard>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info Banner */}
      <div className="mt-8 p-4 rounded-lg bg-accent/5 border border-accent/20 flex gap-3">
        <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-1">Pro Tip</p>
          <p className="text-sm text-muted-foreground">
            Ensure your goals total exactly 100% weightage before submitting. Individual goals must be at least 10%.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}

'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useEffect, useState } from 'react'
import { AlertCircle, FileText, CheckCircle2, Download } from 'lucide-react'
import { toCsv, downloadCsv } from '@/lib/export'
import GoalForm from '@/components/goals/goal-form'
import { useAuth } from '@/components/providers/auth-provider'
import { api } from '@/services/api'
import { GoalSubmission } from '@/lib/validations/goal-schema'

export default function GoalsPage() {
  const { user } = useAuth()
  const [submission, setSubmission] = useState<GoalSubmission | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [usedPeriods, setUsedPeriods] = useState<string[]>([])
  const [isPlanningNew, setIsPlanningNew] = useState(false)

  const fetchSubmission = async () => {
    if (!user) return
    setIsLoading(true)
    
    try {
      const response = await api.getGoals()
      setUsedPeriods((response.submissions || []).map((s: any) => s.period))
      setIsPlanningNew(false)

      if (response.submissions && response.submissions.length > 0) {
        // Find the overall status based on the first submission
        const currentSubmission = response.submissions[0]
        
        setSubmission({
          period: currentSubmission.period || 'Current Goals',
          status: currentSubmission.status as any,
          goals: currentSubmission.goals.map((g: any) => ({
            id: g.id,
            thrust_area: g.thrust_area,
            goal_title: g.goal_title,
            description: g.description,
            uom_type: g.uom_type,
            measurement_type: g.measurement_type,
            target_value: g.target_value,
            weightage: g.weightage,
          }))
        })
      } else {
        setSubmission(null)
      }
    } catch (err) {
      console.error('Error fetching submission:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSubmission()
  }, [user])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-muted text-muted-foreground',
      'pending_approval': 'bg-status-pending/10 text-status-pending',
      'approved': 'bg-status-success/10 text-status-success',
      'rejected': 'bg-destructive/10 text-destructive',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'pending_approval': 'Pending Approval',
      'approved': 'Approved',
      'rejected': 'Needs Revision',
    }
    return labels[status] || status
  }

  const handleExport = () => {
    if (!submission) return
    const rows = submission.goals.map(g => ({
      ...g,
      status: submission.status,
      period: submission.period,
    }))
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
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Goals</h1>
          <p className="text-muted-foreground">Track and manage your quarterly objectives</p>
        </div>
        {submission && submission.goals.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {isPlanningNew ? (
            <GoalForm
              initialData={null}
              usedPeriods={usedPeriods}
              onSuccess={fetchSubmission}
              onCancel={() => setIsPlanningNew(false)}
            />
          ) : (!submission || submission.status === 'draft' || submission.status === 'rejected') ? (
            <GoalForm 
              initialData={submission} 
              onSuccess={fetchSubmission} 
            />
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg shadow-sm">
                <div className={`p-2 rounded-full ${submission.status === 'approved' ? 'bg-status-success/20 text-status-success' : 'bg-status-pending/20 text-status-pending'}`}>
                  {submission.status === 'approved' ? <CheckCircle2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">Goal Submission - {submission.period}</h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    Status: 
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(submission.status)}`}>
                      {getStatusLabel(submission.status)}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setIsPlanningNew(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Plan Next Period
                </button>
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
          )}
        </>
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

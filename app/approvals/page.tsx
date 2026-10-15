'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, MessageCircle, Clock } from 'lucide-react'
import { api } from '@/services/api'
import { useToast } from '@/components/providers/toast-provider'

interface Goal {
  id: string
  employee_id: string
  goal_title: string
  description: string
  thrust_area: string
  uom_type: string
  measurement_type: string
  target_value: number
  weightage: number
  status: string
  created_at: string
}

interface EmployeeSubmission {
  id: string
  employee_id: string
  employee_name: string
  employee_email: string
  period?: string
  status: 'pending_approval' | 'approved' | 'rejected' | string
  goals: Goal[]
}

export default function ApprovalsPage() {
  const { toast } = useToast()
  const [submissions, setSubmissions] = useState<EmployeeSubmission[]>([])
  const [counts, setCounts] = useState({ approved: 0, rejected: 0 })
  const [selectedSubmission, setSelectedSubmission] = useState<EmployeeSubmission | null>(null)
  const [feedbackText, setFeedbackText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit state for inline editing
  const [editedGoals, setEditedGoals] = useState<Record<string, Partial<Goal>>>({})

  const getSubmissionAge = (goals: Goal[]) => {
    if (!goals || goals.length === 0) return 0
    const oldest = Math.min(...goals.map(g => new Date(g.created_at).getTime()))
    if (isNaN(oldest)) return 0
    return Math.max(0, Math.round((Date.now() - oldest) / (1000 * 60 * 60 * 24)))
  }

  const fetchApprovals = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getPendingApprovals()
      if (data?.counts) setCounts(data.counts)
      if (data && data.submissions) {
        setSubmissions(data.submissions)
        setSelectedSubmission(prev => {
          if (!prev && data.submissions.length > 0) return data.submissions[0]
          return prev
        })
      } else {
        setSubmissions([])
      }
    } catch (err: any) {
      console.error('Error fetching approvals:', err)
      setError(err.message || 'Failed to load approvals')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchApprovals()
  }, [])

  // Auto-select updated submission when list updates to refresh the UI
  useEffect(() => {
    if (selectedSubmission) {
      const updated = submissions.find(s => s.id === selectedSubmission.id)
      if (updated) {
        setSelectedSubmission(updated)
      } else {
        setSelectedSubmission(submissions.length > 0 ? submissions[0] : null)
      }
    } else if (submissions.length > 0) {
      setSelectedSubmission(submissions[0])
    }
  }, [submissions])

  const reviewedTotal = (selectedSubmission?.goals || []).reduce(
    (sum, g) => sum + Number(editedGoals[g.id]?.weightage ?? g.weightage ?? 0),
    0
  )

  const handleAction = async (action: 'approved' | 'rejected') => {
    if (!selectedSubmission) return
    setIsSaving(true)
    setError(null)

    try {
      // 1. Prepare goals for backend
      const goalsToUpdate = selectedSubmission.goals.map(g => {
        const edits = editedGoals[g.id] || {}
        return {
          id: g.id,
          target_value: edits.target_value !== undefined ? edits.target_value : g.target_value,
          weightage: edits.weightage !== undefined ? edits.weightage : g.weightage,
        }
      })

      // 2. Call backend
      await api.updateSubmissionStatus(selectedSubmission.id, {
        action,
        remarks: feedbackText || '',
        goals: goalsToUpdate
      })

      // Refresh data from the backend to ensure frontend state matches PostgreSQL
      await fetchApprovals()
      
      setFeedbackText('')
      setEditedGoals({})
      toast(`Successfully ${action === 'approved' ? 'approved' : 'returned for rework'} submission!`, 'success')
      
    } catch (err: any) {
      console.error(`Error performing ${action}:`, err)
      setError(err.message || `Failed to ${action} goals`)
      toast(err.message || `Failed to ${action} goals`, 'error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleInlineEdit = (goalId: string, field: 'target_value' | 'weightage', value: string) => {
    const numValue = value === '' ? 0 : Number(value)
    if (isNaN(numValue)) return

    setEditedGoals(prev => ({
      ...prev,
      [goalId]: {
        ...prev[goalId],
        [field]: numValue
      }
    }))
  }

  const pendingCount = submissions.filter((s) => s.status === 'pending_approval').length

  return (
    <AppLayout userRole="manager">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Approvals Workflow</h1>
        <p className="text-muted-foreground">Manage team submissions and approvals</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive text-destructive rounded-lg">
          <p className="font-medium">Error</p>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Pending Review">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-pending">{pendingCount}</p>
              <p className="text-sm text-muted-foreground mt-2">Awaiting your approval</p>
            </div>
            <div className="text-status-pending/30">
              <Clock className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Approved">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">
                {counts.approved}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Goal plans approved</p>
            </div>
            <div className="text-status-success/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Returned for Rework">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-destructive">
                {counts.rejected}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Waiting on employee edits</p>
            </div>
            <div className="text-destructive/30">
              <XCircle className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Approvals List */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="xl:col-span-1">
          <DashboardCard title="Employee Submissions">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading submissions...</p>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No goal submissions found.</p>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubmission(sub)
                      setEditedGoals({})
                      setFeedbackText('')
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                      selectedSubmission?.id === sub.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">🎯</span>
                          <div>
                            <p className="font-medium text-foreground">{sub.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{sub.goals.length} Goals Submitted</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {sub.status === 'pending_approval' && (() => {
                          const age = getSubmissionAge(sub.goals)
                          if (age > 7) {
                            return (
                              <div className="space-y-1">
                                <div className="px-2.5 py-1 bg-status-pending/20 text-status-pending text-xs font-semibold rounded-full border border-status-pending/20">Pending</div>
                                <div className="px-2 py-0.5 bg-red-500/10 text-red-600 text-[10px] font-bold rounded-full border border-red-500/20 animate-pulse text-center">
                                  ⚠️ {age}d Delay
                                </div>
                              </div>
                            )
                          }
                          return <div className="px-2.5 py-1 bg-status-pending/20 text-status-pending text-xs font-semibold rounded-full border border-status-pending/20">Pending</div>
                        })()}
                        {sub.status === 'approved' && (
                          <div className="px-2.5 py-1 bg-status-success/20 text-status-success text-xs font-semibold rounded-full border border-status-success/20">Approved</div>
                        )}
                        {sub.status === 'rejected' && (
                          <div className="px-2.5 py-1 bg-destructive/20 text-destructive text-xs font-semibold rounded-full border border-destructive/20">Rework</div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </DashboardCard>
        </div>

        {/* Detail Panel */}
        <div className="xl:col-span-2">
          {selectedSubmission ? (
            <DashboardCard title={`Review Goals: ${selectedSubmission.employee_name}`}>
              <div className="space-y-6">
                
                {/* Goals List */}
                <div className="space-y-4">
                  {selectedSubmission.goals.map((goal, idx) => {
                    const isPending = selectedSubmission.status === 'pending_approval'
                    const editedTarget = editedGoals[goal.id]?.target_value ?? goal.target_value
                    const editedWeightage = editedGoals[goal.id]?.weightage ?? goal.weightage

                    return (
                      <div key={goal.id} className="p-4 rounded-lg bg-secondary/30 border border-border">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-lg text-foreground">
                            {idx + 1}. {goal.goal_title}
                          </h3>
                          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-md font-medium">
                            {goal.thrust_area}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">{goal.description}</p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Type</p>
                            <p className="text-sm font-medium">{goal.uom_type}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase">Measurement</p>
                            <p className="text-sm font-medium capitalize">{goal.measurement_type?.replace('_', ' ')}</p>
                          </div>
                          
                          {/* Editable Fields */}
                          <div>
                            <p className="text-xs text-muted-foreground uppercase mb-1">Target</p>
                            {isPending ? (
                              <input 
                                type="number" 
                                value={editedTarget}
                                onChange={(e) => handleInlineEdit(goal.id, 'target_value', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-border rounded bg-card focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <p className="text-sm font-medium">{goal.target_value}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground uppercase mb-1">Weightage (%)</p>
                            {isPending ? (
                              <input 
                                type="number" 
                                value={editedWeightage}
                                onChange={(e) => handleInlineEdit(goal.id, 'weightage', e.target.value)}
                                className="w-full px-2 py-1 text-sm border border-border rounded bg-card focus:ring-1 focus:ring-primary"
                              />
                            ) : (
                              <p className="text-sm font-medium">{goal.weightage}%</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Weightage total after any manager edits */}
                {selectedSubmission.status === 'pending_approval' && (
                  <div className={`flex items-center justify-between p-3 rounded-lg text-sm font-medium ${
                    reviewedTotal === 100 ? 'bg-status-success/10 text-status-success' : 'bg-destructive/10 text-destructive'
                  }`}>
                    <span>Total Weightage</span>
                    <span>{reviewedTotal}%{reviewedTotal !== 100 && ' — must equal 100% to approve'}</span>
                  </div>
                )}

                {/* Feedback */}
                {selectedSubmission.status === 'pending_approval' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Manager Feedback <span className="text-muted-foreground font-normal">(required to return for rework)</span>
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Provide feedback, praise, or reasoning for rework..."
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                    />
                  </div>
                )}

                {/* Status Badge */}
                {selectedSubmission.status !== 'pending_approval' && (
                  <div
                    className={`p-4 rounded-lg flex items-center gap-3 ${
                      selectedSubmission.status === 'approved'
                        ? 'bg-status-success/10 border border-status-success/20 text-status-success'
                        : 'bg-destructive/10 border border-destructive/20 text-destructive'
                    }`}
                  >
                    {selectedSubmission.status === 'approved' ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <p className="text-sm font-semibold">
                      This submission has been {selectedSubmission.status}.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedSubmission.status === 'pending_approval' && (
                  <div className="flex gap-4 pt-4 border-t border-border">
                    <button
                      onClick={() => handleAction('approved')}
                      disabled={isSaving || reviewedTotal !== 100}
                      className="flex-1 px-4 py-2 bg-status-success text-white font-semibold rounded-lg hover:bg-status-success/90 transition-colors duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? 'Processing...' : (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Approve Goals
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleAction('rejected')}
                      disabled={isSaving || !feedbackText.trim()}
                      className="flex-1 px-4 py-2 bg-destructive text-white font-semibold rounded-lg hover:bg-destructive/90 transition-colors duration-200 shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSaving ? 'Processing...' : (
                        <>
                          <MessageCircle className="w-4 h-4" /> Return for Rework
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </DashboardCard>
          ) : (
            <DashboardCard title="No Submission Selected">
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <CheckCircle2 className="w-16 h-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">Select an employee to review</p>
                <p className="text-sm mt-1">Their goal details and approval actions will appear here.</p>
              </div>
            </DashboardCard>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

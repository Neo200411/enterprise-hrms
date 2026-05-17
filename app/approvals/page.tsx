'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState } from 'react'
import { CheckCircle2, XCircle, MessageCircle, Clock } from 'lucide-react'

interface ApprovalItem {
  id: number
  employeeName: string
  employeeId: string
  type: 'goal_update' | 'review_submission' | 'time_off'
  title: string
  description: string
  submittedDate: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'high' | 'medium' | 'low'
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<ApprovalItem[]>([
    {
      id: 1,
      employeeName: 'Alice Johnson',
      employeeId: 'EMP001',
      type: 'goal_update',
      title: 'Q4 Goal Progress Update',
      description: 'Updated progress on Product Documentation goal from 50% to 75%',
      submittedDate: '2024-12-01',
      status: 'pending',
      priority: 'high',
    },
    {
      id: 2,
      employeeName: 'Bob Smith',
      employeeId: 'EMP002',
      type: 'review_submission',
      title: 'Q4 Performance Review Submitted',
      description: 'Self-assessment and feedback for quarterly performance review',
      submittedDate: '2024-11-28',
      status: 'pending',
      priority: 'high',
    },
    {
      id: 3,
      employeeName: 'Carol White',
      employeeId: 'EMP003',
      type: 'time_off',
      title: 'Time Off Request - 2 weeks',
      description: 'Requesting time off from Dec 20 - Jan 2',
      submittedDate: '2024-11-25',
      status: 'pending',
      priority: 'medium',
    },
  ])

  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null)
  const [feedbackText, setFeedbackText] = useState('')

  const handleApprove = (id: number) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'approved' } : a))
    )
    setSelectedApproval(null)
  }

  const handleReject = (id: number) => {
    setApprovals((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'rejected' } : a))
    )
    setSelectedApproval(null)
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: 'bg-destructive/10 text-destructive border-destructive/20',
      medium: 'bg-status-pending/10 text-status-pending border-status-pending/20',
      low: 'bg-status-success/10 text-status-success border-status-success/20',
    }
    return colors[priority] || ''
  }

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      goal_update: 'Goal Update',
      review_submission: 'Review',
      time_off: 'Time Off',
    }
    return labels[type] || type
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      goal_update: '🎯',
      review_submission: '📋',
      time_off: '🏖️',
    }
    return icons[type] || '📌'
  }

  const pendingCount = approvals.filter((a) => a.status === 'pending').length

  return (
    <AppLayout userRole="manager">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Approvals Workflow</h1>
        <p className="text-muted-foreground">Manage team submissions and approvals</p>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Pending">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-pending">{pendingCount}</p>
              <p className="text-sm text-muted-foreground mt-2">Awaiting your review</p>
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
                {approvals.filter((a) => a.status === 'approved').length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">This month</p>
            </div>
            <div className="text-status-success/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Rejected">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-destructive">
                {approvals.filter((a) => a.status === 'rejected').length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">This month</p>
            </div>
            <div className="text-destructive/30">
              <XCircle className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Approvals List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main List */}
        <div className="lg:col-span-2">
          <DashboardCard title="Items to Review">
            <div className="space-y-3">
              {approvals.map((approval) => (
                <button
                  key={approval.id}
                  onClick={() => setSelectedApproval(approval)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                    selectedApproval?.id === approval.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getTypeIcon(approval.type)}</span>
                        <div>
                          <p className="font-medium text-foreground">{approval.title}</p>
                          <p className="text-sm text-muted-foreground">{approval.employeeName}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {approval.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                          approval.priority
                        )}`}
                      >
                        {approval.priority.charAt(0).toUpperCase() + approval.priority.slice(1)}
                      </span>
                      {approval.status === 'pending' && (
                        <div className="mt-2 w-2 h-2 bg-status-pending rounded-full"></div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Detail Panel */}
        <div>
          {selectedApproval ? (
            <DashboardCard title="Review Details">
              <div className="space-y-4">
                {/* Employee Info */}
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground uppercase">Employee</p>
                  <p className="font-medium text-foreground">{selectedApproval.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{selectedApproval.employeeId}</p>
                </div>

                {/* Type & Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground uppercase">Type</p>
                    <p className="font-medium text-foreground text-sm">
                      {getTypeLabel(selectedApproval.type)}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <p className="text-xs text-muted-foreground uppercase">Submitted</p>
                    <p className="font-medium text-foreground text-sm">
                      {selectedApproval.submittedDate}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-xs text-muted-foreground uppercase mb-2">Details</p>
                  <p className="text-sm text-foreground">{selectedApproval.description}</p>
                </div>

                {/* Feedback */}
                {selectedApproval.status === 'pending' && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Add Feedback (Optional)
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Provide feedback or conditions for approval..."
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none text-sm"
                    />
                  </div>
                )}

                {/* Status Badge */}
                {selectedApproval.status !== 'pending' && (
                  <div
                    className={`p-3 rounded-lg ${
                      selectedApproval.status === 'approved'
                        ? 'bg-status-success/10 border border-status-success/20'
                        : 'bg-destructive/10 border border-destructive/20'
                    }`}
                  >
                    <p className="text-sm font-medium">
                      {selectedApproval.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedApproval.status === 'pending' && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprove(selectedApproval.id)}
                      className="flex-1 px-3 py-2 bg-status-success text-white font-medium rounded-lg hover:bg-status-success/90 transition-colors duration-200 text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedApproval.id)}
                      className="flex-1 px-3 py-2 bg-destructive text-white font-medium rounded-lg hover:bg-destructive/90 transition-colors duration-200 text-sm"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </DashboardCard>
          ) : (
            <DashboardCard title="No Selection">
              <p className="text-sm text-muted-foreground text-center py-4">
                Select an item to review details and take action
              </p>
            </DashboardCard>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

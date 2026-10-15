'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useEffect, useState } from 'react'
import { Filter, Download } from 'lucide-react'
import { api } from '@/services/api'
import { toCsv, downloadCsv } from '@/lib/export'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  resource: string
  outcome: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  details: string
}

type LogFilter = 'all' | 'submissions' | 'approved' | 'rejected'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<LogFilter>('all')

  useEffect(() => {
    api.getAuditLogs()
      .then((data) => setLogs(data.logs || []))
      .catch((err: any) => setError(err.message || 'Failed to load audit logs'))
      .finally(() => setIsLoading(false))
  }, [])

  const isReview = (log: AuditLog) => log.id.startsWith('approval-')

  const filteredLogs = logs.filter((log) => {
    if (filter === 'submissions') return !isReview(log)
    if (filter === 'approved') return isReview(log) && log.outcome === 'approved'
    if (filter === 'rejected') return isReview(log) && log.outcome === 'rejected'
    return true
  })

  const reviewCount = logs.filter(isReview).length
  const reworkCount = logs.filter((l) => isReview(l) && l.outcome === 'rejected').length

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'Approved Goals': 'bg-status-success/10 text-status-success',
      'Returned for Rework': 'bg-destructive/10 text-destructive',
      'Submitted Goals': 'bg-primary/10 text-primary',
      'Saved Draft': 'bg-muted text-muted-foreground',
    }
    return colors[action] || 'bg-muted text-muted-foreground'
  }

  const handleExport = () => {
    const columns = [
      { key: 'timestamp', label: 'Timestamp' },
      { key: 'user', label: 'User' },
      { key: 'action', label: 'Action' },
      { key: 'resource', label: 'Resource' },
      { key: 'details', label: 'Details' },
    ]
    downloadCsv(toCsv(filteredLogs, columns), `audit-logs-${Date.now()}.csv`)
  }

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
        <button
          onClick={handleExport}
          disabled={filteredLogs.length === 0}
          className="flex items-center gap-2 px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-secondary disabled:opacity-50 transition-colors duration-200"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Total Activities">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-primary">{logs.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Most recent events</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Reviews">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">
                {reviewCount}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Manager decisions</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Returned for Rework">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-destructive">
                {reworkCount}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Submissions sent back</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Logs Table */}
      <DashboardCard title="Activity Log">
        {/* Filter */}
        <div className="mb-6 flex items-center gap-2">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as LogFilter)}
            className="px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">All Activities</option>
            <option value="submissions">Goal Submissions</option>
            <option value="approved">Approvals</option>
            <option value="rejected">Returned for Rework</option>
          </select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="p-3 mb-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>
        )}

        {/* Logs */}
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors duration-200"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </div>
                  <p className="font-medium text-foreground mb-1">{log.resource}</p>
                  <p className="text-sm text-muted-foreground">{log.details}</p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-medium text-foreground">{log.user}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(log.timestamp)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {!isLoading && !error && filteredLogs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No logs found matching your filter</p>
          </div>
        )}
      </DashboardCard>

    </AppLayout>
  )
}

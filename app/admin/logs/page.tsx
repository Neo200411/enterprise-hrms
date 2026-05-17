'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState } from 'react'
import { Filter, Download } from 'lucide-react'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  action: string
  resource: string
  status: 'success' | 'failed'
  details: string
}

export default function AuditLogsPage() {
  const [logs] = useState<AuditLog[]>([
    {
      id: 'LOG001',
      timestamp: '2024-12-01T14:30:00Z',
      user: 'Jane Smith',
      action: 'Updated Goal',
      resource: 'Goal #2451',
      status: 'success',
      details: 'Updated progress from 50% to 75%',
    },
    {
      id: 'LOG002',
      timestamp: '2024-12-01T13:15:00Z',
      user: 'John Manager',
      action: 'Approved Review',
      resource: 'Review #1023',
      status: 'success',
      details: 'Approved Q4 performance review',
    },
    {
      id: 'LOG003',
      timestamp: '2024-12-01T12:45:00Z',
      user: 'Admin User',
      action: 'Added Employee',
      resource: 'Employee #156',
      status: 'success',
      details: 'Created new employee profile',
    },
    {
      id: 'LOG004',
      timestamp: '2024-12-01T11:20:00Z',
      user: 'Alice Johnson',
      action: 'Submitted Review',
      resource: 'Review #1023',
      status: 'success',
      details: 'Submitted self-assessment',
    },
    {
      id: 'LOG005',
      timestamp: '2024-12-01T10:00:00Z',
      user: 'Bob Smith',
      action: 'Created Goal',
      resource: 'Goal #2500',
      status: 'failed',
      details: 'Duplicate goal title detected',
    },
    {
      id: 'LOG006',
      timestamp: '2024-12-01T09:30:00Z',
      user: 'Admin User',
      action: 'Bulk Import',
      resource: 'Employees',
      status: 'success',
      details: 'Imported 25 employees from HR system',
    },
  ])

  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'failed'>('all')

  const filteredLogs = logs.filter((log) => filterStatus === 'all' || log.status === filterStatus)

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      'Updated Goal': 'bg-primary/10 text-primary',
      'Approved Review': 'bg-status-success/10 text-status-success',
      'Added Employee': 'bg-accent/10 text-accent',
      'Submitted Review': 'bg-primary/10 text-primary',
      'Created Goal': 'bg-accent/10 text-accent',
      'Bulk Import': 'bg-status-success/10 text-status-success',
    }
    return colors[action] || 'bg-muted text-muted-foreground'
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
    <AppLayout userRole="admin">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Audit Logs</h1>
          <p className="text-muted-foreground">Track all system activities and changes</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-secondary transition-colors duration-200">
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
              <p className="text-sm text-muted-foreground mt-2">This month</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Successful">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">
                {logs.filter((l) => l.status === 'success').length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Completed successfully</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Failed">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-destructive">
                {logs.filter((l) => l.status === 'failed').length}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Errors encountered</p>
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
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'success' | 'failed')}
            className="px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
          >
            <option value="all">All Activities</option>
            <option value="success">Successful</option>
            <option value="failed">Failed</option>
          </select>
        </div>

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
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        log.status === 'success'
                          ? 'bg-status-success/10 text-status-success'
                          : 'bg-destructive/10 text-destructive'
                      }`}
                    >
                      {log.status === 'success' ? '✓ Success' : '✗ Failed'}
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

        {filteredLogs.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No logs found matching your filter</p>
          </div>
        )}
      </DashboardCard>

      {/* Legend */}
      <div className="mt-8 p-4 rounded-lg bg-secondary/50 border border-border">
        <p className="font-medium text-foreground mb-3">Common Actions</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-medium text-foreground">Goal Management</p>
            <p className="text-muted-foreground">Created, Updated, Completed goals</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Reviews & Approvals</p>
            <p className="text-muted-foreground">Submitted, Approved, Rejected reviews</p>
          </div>
          <div>
            <p className="font-medium text-foreground">Employee Management</p>
            <p className="text-muted-foreground">Added, Updated, Removed employees</p>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

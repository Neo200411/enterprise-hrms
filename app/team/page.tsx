'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { Users, ArrowRight, TrendingUp } from 'lucide-react'

interface TeamMember {
  id: number
  name: string
  role: string
  department: string
  avatar: string
  performance: number
  activeGoals: number
  status: 'on-track' | 'at-risk' | 'excellent'
}

export default function TeamPage() {
  const teamMembers: TeamMember[] = [
    {
      id: 1,
      name: 'Alice Johnson',
      role: 'Senior Developer',
      department: 'Engineering',
      avatar: 'A',
      performance: 92,
      activeGoals: 4,
      status: 'excellent',
    },
    {
      id: 2,
      name: 'Bob Smith',
      role: 'Product Manager',
      department: 'Product',
      avatar: 'B',
      performance: 85,
      activeGoals: 5,
      status: 'on-track',
    },
    {
      id: 3,
      name: 'Carol White',
      role: 'Designer',
      department: 'Design',
      avatar: 'C',
      performance: 78,
      activeGoals: 3,
      status: 'at-risk',
    },
    {
      id: 4,
      name: 'Diana Chen',
      role: 'Data Analyst',
      department: 'Analytics',
      avatar: 'D',
      performance: 88,
      activeGoals: 4,
      status: 'on-track',
    },
  ]

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      excellent: 'bg-status-success/10 text-status-success border-status-success/20',
      'on-track': 'bg-primary/10 text-primary border-primary/20',
      'at-risk': 'bg-destructive/10 text-destructive border-destructive/20',
    }
    return colors[status] || ''
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      excellent: 'Excellent',
      'on-track': 'On Track',
      'at-risk': 'At Risk',
    }
    return labels[status] || status
  }

  return (
    <AppLayout userRole="manager">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Team Members</h1>
        <p className="text-muted-foreground">Monitor your team&apos;s performance and goals</p>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Team Size">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-primary">{teamMembers.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Members</p>
            </div>
            <div className="text-primary/30">
              <Users className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Team Performance">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-accent">
                {Math.round(teamMembers.reduce((sum, m) => sum + m.performance, 0) / teamMembers.length)}%
              </p>
              <p className="text-sm text-muted-foreground mt-2">Average score</p>
            </div>
            <div className="text-accent/30">
              <TrendingUp className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Active Goals">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">
                {teamMembers.reduce((sum, m) => sum + m.activeGoals, 0)}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Across team</p>
            </div>
            <div className="text-status-success/30">
              <ArrowRight className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Team Members List */}
      <DashboardCard title="Team Members">
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors duration-200"
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Avatar */}
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm">
                  {member.avatar}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <p className="font-medium text-foreground">{member.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {member.role} • {member.department}
                  </p>
                </div>
              </div>

              {/* Performance */}
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-foreground">{member.performance}%</p>
                  <p className="text-xs text-muted-foreground">Performance</p>
                </div>

                {/* Active Goals Badge */}
                <div className="text-center">
                  <p className="font-bold text-accent">{member.activeGoals}</p>
                  <p className="text-xs text-muted-foreground">Goals</p>
                </div>

                {/* Status */}
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${getStatusColor(member.status)}`}
                >
                  {getStatusLabel(member.status)}
                </span>

                {/* Action */}
                <button className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200">
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Quick Tips */}
      <div className="mt-8 p-4 rounded-lg bg-accent/5 border border-accent/20">
        <p className="font-medium text-foreground mb-2">Team Management Tips</p>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Regular one-on-ones help identify challenges early</li>
          <li>• Provide timely feedback on goal progress</li>
          <li>• Celebrate wins and milestones with your team</li>
          <li>• Review and adjust goals quarterly as needed</li>
        </ul>
      </div>
    </AppLayout>
  )
}

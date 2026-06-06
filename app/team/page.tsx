'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { Users, ArrowRight, TrendingUp, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/services/api'

interface TeamMember {
  employee_id: string
  employee_name: string
  employee_email: string
  role: string
  active_goals_count: number
  completed_goals_count: number
  pending_goals_count: number
  latest_checkin_quarter: string | null
  performance_score: number
}

export default function TeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('')

  // Pagination state
  const [page, setPage] = useState(1)
  const [limit] = useState(50)

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const res = await api.getTeamMembers(page, limit)
        setTeamMembers(res.data || [])
      } catch (err: any) {
        console.error('Failed to fetch team members:', err)
        setError(err.message || 'Failed to load team data.')
      } finally {
        setIsLoading(false)
      }
    }
    fetchTeam()
  }, [page, limit])

  const getStatusInfo = (score: number) => {
    if (score >= 90) return { status: 'excellent', label: 'Excellent', color: 'bg-status-success/10 text-status-success border-status-success/20' }
    if (score >= 70) return { status: 'on-track', label: 'On Track', color: 'bg-primary/10 text-primary border-primary/20' }
    return { status: 'at-risk', label: 'At Risk', color: 'bg-destructive/10 text-destructive border-destructive/20' }
  }

  const filteredMembers = teamMembers.filter(member => 
    member.employee_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.employee_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.role.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const avgPerformance = teamMembers.length > 0 
    ? Math.round(teamMembers.reduce((sum, m) => sum + m.performance_score, 0) / teamMembers.length)
    : 0

  const totalActiveGoals = teamMembers.reduce((sum, m) => sum + m.active_goals_count, 0)

  return (
    <AppLayout userRole="manager">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Team Members</h1>
        <p className="text-muted-foreground">Monitor your team&apos;s performance and goals</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">
          {error}
        </div>
      )}

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
                {avgPerformance}%
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
                {totalActiveGoals}
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
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search team members by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <div key={i} className="h-16 rounded-lg bg-secondary animate-pulse" />)}
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              {searchQuery ? 'No team members match your search.' : 'No team members found.'}
            </div>
          ) : (
            filteredMembers.map((member) => {
              const { label, color } = getStatusInfo(member.performance_score)
              return (
                <div
                  key={member.employee_id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-secondary/50 transition-colors duration-200"
                >
                  <div className="flex items-center gap-4 flex-1">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm uppercase">
                      {member.employee_name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{member.employee_name}</p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {member.role}
                      </p>
                    </div>
                  </div>

                  {/* Performance */}
                  <div className="flex items-center gap-4 hidden sm:flex">
                    <div className="text-right">
                      <p className="font-bold text-foreground">{member.performance_score}%</p>
                      <p className="text-xs text-muted-foreground">Performance</p>
                    </div>

                    {/* Active Goals Badge */}
                    <div className="text-center w-16">
                      <p className="font-bold text-accent">{member.active_goals_count}</p>
                      <p className="text-xs text-muted-foreground">Goals</p>
                    </div>

                    {/* Status */}
                    <span
                      className={`px-3 py-1 text-xs font-medium rounded-full border w-24 text-center ${color}`}
                    >
                      {label}
                    </span>

                    {/* Action */}
                    <button className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200">
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              )
            })
          )}
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

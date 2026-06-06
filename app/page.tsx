'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { useState, useEffect } from 'react'
import { api } from '@/services/api'
import Link from 'next/link'

interface Checkin {
  id: string
  goal_id: string
  goal_title: string
  quarter: string
  actual_achievement: number
  progress_status: string
  created_at: string
}

interface EmployeeDashboardData {
  activeGoals: number
  completedGoals: number
  pendingGoals: number
  performanceScore: number
  latestSubmissionStatus: string | null
  recentCheckins: Checkin[]
}

export default function Home() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<EmployeeDashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setIsLoading(true)
        const res = await api.getEmployeeDashboard()
        setDashboardData(res)
      } catch (err: any) {
        console.error('Failed to fetch employee dashboard:', err)
        setError('Failed to load dashboard metrics. Please refresh.')
      } finally {
        setIsLoading(false)
      }
    }

    if (user) {
      fetchDashboard()
    }
  }, [user])
  
  return (
    <AppLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {user?.name?.split(' ')[0] || 'User'}
        </h1>
        <p className="text-muted-foreground">Here&apos;s your performance overview</p>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-64 rounded-lg bg-secondary animate-pulse" />
            <div className="h-64 rounded-lg bg-secondary animate-pulse" />
          </div>
        </div>
      ) : dashboardData ? (
        <>
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Active Goals */}
            <DashboardCard title="Active Goals" description="Approved & In-progress">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-primary">{dashboardData.activeGoals}</p>
                </div>
                <div className="text-primary/30">
                  <Zap className="w-12 h-12" />
                </div>
              </div>
            </DashboardCard>

            {/* Completed Goals */}
            <DashboardCard title="Completed Goals" description="Successfully achieved">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-status-success">{dashboardData.completedGoals}</p>
                </div>
                <div className="text-status-success/30">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
              </div>
            </DashboardCard>

            {/* Pending Approvals */}
            <DashboardCard title="Pending Review" description="Awaiting manager feedback">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-status-pending">{dashboardData.pendingGoals}</p>
                </div>
                <div className="text-status-pending/30">
                  <Clock className="w-12 h-12" />
                </div>
              </div>
            </DashboardCard>

            {/* Performance Score */}
            <DashboardCard title="Performance" description="Overall average">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-4xl font-bold text-accent">{dashboardData.performanceScore}%</p>
                </div>
                <div className="text-accent/30">
                  <AlertCircle className="w-12 h-12" />
                </div>
              </div>
            </DashboardCard>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Checkins */}
            <div className="lg:col-span-2">
              <DashboardCard
                title="Recent Check-ins"
                description="Your latest goal updates"
              >
                <div className="space-y-3">
                  {dashboardData.recentCheckins.length > 0 ? (
                    dashboardData.recentCheckins.map((checkin) => (
                      <div key={checkin.id} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{checkin.goal_title}</p>
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            Achievement: {checkin.actual_achievement}%
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                            {checkin.progress_status}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">{checkin.quarter}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent check-ins found.
                    </div>
                  )}
                </div>
              </DashboardCard>
            </div>

            {/* Quick Actions & Status */}
            <div className="space-y-6">
              <DashboardCard title="Latest Submission">
                <div className="text-center py-4">
                  {dashboardData.latestSubmissionStatus ? (
                    <>
                      <div className="w-16 h-16 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
                        {dashboardData.latestSubmissionStatus === 'approved' && <CheckCircle2 className="w-8 h-8 text-status-success" />}
                        {dashboardData.latestSubmissionStatus === 'pending_approval' && <Clock className="w-8 h-8 text-status-pending" />}
                        {dashboardData.latestSubmissionStatus === 'rejected' && <AlertCircle className="w-8 h-8 text-destructive" />}
                        {dashboardData.latestSubmissionStatus === 'draft' && <Zap className="w-8 h-8 text-muted-foreground" />}
                      </div>
                      <h3 className="font-medium text-foreground mb-1 capitalize">{dashboardData.latestSubmissionStatus.replace('_', ' ')}</h3>
                      <p className="text-sm text-muted-foreground">
                        Your most recent goal submission status.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No goal submissions yet.</p>
                  )}
                </div>
              </DashboardCard>

              <DashboardCard title="Quick Links">
                <div className="space-y-2">
                  <Link href="/goals" className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors duration-200 group border border-transparent hover:border-border">
                    <span className="font-medium text-foreground text-sm">View All Goals</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                  <Link href="/checkins" className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-secondary transition-colors duration-200 group border border-transparent hover:border-border">
                    <span className="font-medium text-foreground text-sm">Submit Check-in</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </Link>
                </div>
              </DashboardCard>
            </div>
          </div>
        </>
      ) : null}
    </AppLayout>
  )
}

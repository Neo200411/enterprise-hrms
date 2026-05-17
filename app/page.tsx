'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { ArrowRight, CheckCircle2, Clock, AlertCircle, Zap } from 'lucide-react'

export default function Home() {
  const userRole = 'employee'

  return (
    <AppLayout userRole={userRole}>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back, Jane</h1>
        <p className="text-muted-foreground">Here&apos;s your performance overview for this quarter</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Active Goals */}
        <DashboardCard
          title="Active Goals"
          description="Current quarter"
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-primary">5</p>
              <p className="text-sm text-muted-foreground mt-2">3 in progress</p>
            </div>
            <div className="text-primary/30">
              <Zap className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        {/* Completed Goals */}
        <DashboardCard
          title="Completed Goals"
          description="This year"
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">12</p>
              <p className="text-sm text-muted-foreground mt-2">100% achievement rate</p>
            </div>
            <div className="text-status-success/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        {/* Pending Approvals */}
        <DashboardCard
          title="Pending Review"
          description="Awaiting feedback"
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-pending">2</p>
              <p className="text-sm text-muted-foreground mt-2">From manager</p>
            </div>
            <div className="text-status-pending/30">
              <Clock className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        {/* Performance Score */}
        <DashboardCard
          title="Performance"
          description="This quarter"
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-accent">92%</p>
              <p className="text-sm text-muted-foreground mt-2">Excellent performance</p>
            </div>
            <div className="text-accent/30">
              <AlertCircle className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals Section */}
        <div className="lg:col-span-2">
          <DashboardCard
            title="Your Goals"
            description="Q4 2024 Objectives"
            action={{ label: 'Add Goal', onClick: () => {} }}
          >
            <div className="space-y-3">
              {/* Goal Item */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Complete Product Documentation</p>
                  <p className="text-sm text-muted-foreground">Due by Dec 31, 2024</p>
                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full w-3/4"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">75% complete</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">In Progress</span>
              </div>

              {/* Goal Item */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-status-success mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Team Training Program</p>
                  <p className="text-sm text-muted-foreground">Due by Nov 30, 2024</p>
                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div className="bg-status-success h-2 rounded-full w-full"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">100% complete</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-status-success/10 text-status-success rounded">Completed</span>
              </div>

              {/* Goal Item */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="w-2 h-2 rounded-full bg-status-pending mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Quarterly Review Submission</p>
                  <p className="text-sm text-muted-foreground">Due by Dec 5, 2024</p>
                  <div className="mt-2 w-full bg-muted rounded-full h-2">
                    <div className="bg-status-pending h-2 rounded-full w-1/4"></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">25% complete</p>
                </div>
                <span className="px-2 py-1 text-xs font-medium bg-status-pending/10 text-status-pending rounded">Pending</span>
              </div>
            </div>
          </DashboardCard>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <DashboardCard title="Quick Actions">
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 font-medium">
                <span>Update Progress</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200 font-medium">
                <span>Request Feedback</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200 font-medium">
                <span>View Resources</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </DashboardCard>

          {/* Upcoming Dates */}
          <DashboardCard title="Important Dates">
            <div className="space-y-3">
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center font-bold text-sm text-accent">
                  05
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Q4 Review Due</p>
                  <p className="text-xs text-muted-foreground">Dec 5, 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-3 pb-3 border-b border-border">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center font-bold text-sm text-primary">
                  15
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Team Sync</p>
                  <p className="text-xs text-muted-foreground">Dec 15, 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-status-success/20 flex items-center justify-center font-bold text-sm text-status-success">
                  31
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">Year-End Deadline</p>
                  <p className="text-xs text-muted-foreground">Dec 31, 2024</p>
                </div>
              </div>
            </div>
          </DashboardCard>
        </div>
      </div>
    </AppLayout>
  )
}

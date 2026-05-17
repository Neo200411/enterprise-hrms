'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { BarChart3, Users, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ManagerDashboard() {
  return (
    <AppLayout userRole="manager">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Manager Dashboard</h1>
        <p className="text-muted-foreground">Team performance and goal tracking overview</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <DashboardCard title="Team Members">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-primary">12</p>
              <p className="text-sm text-muted-foreground mt-2">Direct reports</p>
            </div>
            <div className="text-primary/30">
              <Users className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Team Goals">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-accent">48</p>
              <p className="text-sm text-muted-foreground mt-2">Active goals</p>
            </div>
            <div className="text-accent/30">
              <BarChart3 className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Approvals Pending">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-pending">3</p>
              <p className="text-sm text-muted-foreground mt-2">Awaiting review</p>
            </div>
            <div className="text-status-pending/30">
              <AlertCircle className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Team Score">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">87%</p>
              <p className="text-sm text-muted-foreground mt-2">Overall performance</p>
            </div>
            <div className="text-status-success/30">
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Team Performance */}
        <div className="lg:col-span-2">
          <DashboardCard title="Team Performance Distribution">
            <div className="space-y-4">
              {[
                { label: 'Excellent (90-100%)', count: 4, percentage: 33, color: 'bg-status-success' },
                { label: 'Good (80-89%)', count: 6, percentage: 50, color: 'bg-primary' },
                { label: 'Needs Improvement (70-79%)', count: 2, percentage: 17, color: 'bg-status-pending' },
              ].map((category) => (
                <div key={category.label}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{category.label}</span>
                    <span className="text-sm font-bold text-foreground">{category.count} members</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div
                      className={`${category.color} h-3 rounded-full`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>

        {/* Quick Actions */}
        <DashboardCard title="Quick Actions">
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors duration-200 font-medium text-sm">
              <span>Review Approvals</span>
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">3</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200 font-medium text-sm">
              <span>Check Team Performance</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200 font-medium text-sm">
              <span>Schedule 1-on-1s</span>
            </button>
            <button className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors duration-200 font-medium text-sm">
              <span>Generate Report</span>
            </button>
          </div>
        </DashboardCard>
      </div>

      {/* Goal Status Overview */}
      <div className="mt-8">
        <DashboardCard title="Team Goal Status">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { status: 'In Progress', count: 24, color: 'bg-primary' },
              { status: 'Completed', count: 18, color: 'bg-status-success' },
              { status: 'Pending', count: 4, color: 'bg-status-pending' },
              { status: 'Blocked', count: 2, color: 'bg-destructive' },
            ].map((item) => (
              <div key={item.status} className="text-center p-4 rounded-lg bg-secondary/50 border border-border">
                <p className="text-3xl font-bold text-foreground mb-1">{item.count}</p>
                <p className="text-sm text-muted-foreground">{item.status}</p>
                <div className={`${item.color} h-1 rounded-full mt-3 w-full`}></div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
    </AppLayout>
  )
}

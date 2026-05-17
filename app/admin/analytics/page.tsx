'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const performanceData = [
  { month: 'Jan', performance: 72, target: 80 },
  { month: 'Feb', performance: 75, target: 80 },
  { month: 'Mar', performance: 78, target: 80 },
  { month: 'Apr', performance: 82, target: 80 },
  { month: 'May', performance: 85, target: 85 },
  { month: 'Jun', performance: 88, target: 85 },
  { month: 'Jul', performance: 87, target: 85 },
  { month: 'Aug', performance: 90, target: 90 },
]

const goalData = [
  { quarter: 'Q1', completed: 24, inProgress: 18, pending: 8 },
  { quarter: 'Q2', completed: 32, inProgress: 22, pending: 6 },
  { quarter: 'Q3', completed: 38, inProgress: 24, pending: 5 },
  { quarter: 'Q4', completed: 42, inProgress: 28, pending: 4 },
]

const departmentData = [
  { name: 'Engineering', value: 35, color: '#1e3a5f' },
  { name: 'Product', value: 25, color: '#3b5bdb' },
  { name: 'Design', value: 20, color: '#7c3aed' },
  { name: 'Analytics', value: 15, color: '#06b6d4' },
  { name: 'HR', value: 5, color: '#10b981' },
]

const employeeMetrics = [
  { name: 'Total Employees', value: 156 },
  { name: 'Active Goals', value: 487 },
  { name: 'Goal Completion Rate', value: '92%' },
  { name: 'Avg Performance Score', value: '87%' },
]

export default function AnalyticsDashboard() {
  return (
    <AppLayout userRole="admin">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Company-wide performance metrics and insights</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {employeeMetrics.map((metric) => (
          <DashboardCard key={metric.name} title={metric.name}>
            <div className="flex items-end justify-between">
              <p className="text-4xl font-bold text-primary">{metric.value}</p>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Performance Trend */}
        <DashboardCard title="Performance Trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
                cursor={{ stroke: 'var(--primary)' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="performance"
                stroke="var(--chart-1)"
                strokeWidth={2}
                dot={{ fill: 'var(--chart-1)', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="target"
                stroke="var(--chart-2)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ fill: 'var(--chart-2)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Goal Completion by Quarter */}
        <DashboardCard title="Goal Completion by Quarter">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={goalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="quarter" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="completed" fill="var(--chart-1)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="inProgress" fill="var(--chart-2)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="pending" fill="var(--chart-5)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </DashboardCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Employees by Department */}
        <DashboardCard title="Employees by Department">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} (${value})`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </DashboardCard>

        {/* Department Insights */}
        <DashboardCard title="Department Insights">
          <div className="space-y-4">
            {departmentData.map((dept) => (
              <div key={dept.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: dept.color }}
                    ></div>
                    <span className="text-sm font-medium text-foreground">{dept.name}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">{dept.value} employees</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full"
                    style={{
                      backgroundColor: dept.color,
                      width: `${(dept.value / 35) * 100}%`,
                    }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Summary Stats */}
      <DashboardCard title="Summary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Goal Achievement Rate</p>
            <p className="text-2xl font-bold text-status-success">92%</p>
            <p className="text-xs text-status-success/70 mt-1">↑ 3% from last quarter</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Avg. Time to Complete</p>
            <p className="text-2xl font-bold text-accent">12.5 weeks</p>
            <p className="text-xs text-accent/70 mt-1">↓ 1.2 weeks from last quarter</p>
          </div>
          <div className="p-4 rounded-lg bg-secondary/50 border border-border">
            <p className="text-sm text-muted-foreground mb-1">Engagement Score</p>
            <p className="text-2xl font-bold text-primary">8.7/10</p>
            <p className="text-xs text-primary/70 mt-1">↑ 0.5 points from last quarter</p>
          </div>
        </div>
      </DashboardCard>
    </AppLayout>
  )
}

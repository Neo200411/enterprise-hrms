'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState } from 'react'
import { Plus, Edit2, Trash2, AlertCircle } from 'lucide-react'

export default function GoalsPage() {
  const [showForm, setShowForm] = useState(false)
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: 'Complete Product Documentation',
      description: 'Write comprehensive documentation for all API endpoints',
      quarter: 'Q4 2024',
      status: 'in-progress',
      progress: 75,
      dueDate: '2024-12-31',
      keyResults: [
        'API documentation complete',
        'User guides written',
        'Video tutorials created',
      ],
    },
    {
      id: 2,
      title: 'Team Training Program',
      description: 'Develop and deliver training for the team',
      quarter: 'Q4 2024',
      status: 'completed',
      progress: 100,
      dueDate: '2024-11-30',
      keyResults: [
        'Training materials created',
        'Sessions conducted',
        'Feedback collected',
      ],
    },
  ])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'in-progress': 'bg-primary/10 text-primary',
      completed: 'bg-status-success/10 text-status-success',
      pending: 'bg-status-pending/10 text-status-pending',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      'in-progress': 'In Progress',
      completed: 'Completed',
      pending: 'Pending',
    }
    return labels[status] || status
  }

  return (
    <AppLayout>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">My Goals</h1>
          <p className="text-muted-foreground">Track and manage your quarterly objectives</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200"
        >
          <Plus className="w-5 h-5" />
          Add Goal
        </button>
      </div>

      {/* Add Goal Form */}
      {showForm && (
        <DashboardCard
          title="Create New Goal"
          className="mb-8 bg-accent/5 border-accent"
        >
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Goal Title
                </label>
                <input
                  type="text"
                  placeholder="e.g., Launch new product feature"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Quarter
                </label>
                <select className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary">
                  <option>Q4 2024</option>
                  <option>Q1 2025</option>
                  <option>Q2 2025</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                placeholder="Describe your goal and what success looks like"
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Due Date
              </label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200"
              >
                Create Goal
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-secondary transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </DashboardCard>
      )}

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal) => (
          <DashboardCard
            key={goal.id}
            title={goal.title}
            description={goal.description}
            action={{
              label: 'Edit',
              onClick: () => {},
            }}
          >
            <div className="space-y-4">
              {/* Meta Info */}
              <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-border">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Quarter</p>
                    <p className="font-medium text-foreground">{goal.quarter}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Due Date</p>
                    <p className="font-medium text-foreground">{goal.dueDate}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(goal.status)}`}>
                  {getStatusLabel(goal.status)}
                </span>
              </div>

              {/* Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground">Progress</p>
                  <p className="text-sm font-bold text-primary">{goal.progress}%</p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Key Results */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">Key Results</p>
                <ul className="space-y-2">
                  {goal.keyResults.map((kr, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full border border-border flex items-center justify-center flex-shrink-0 mt-0.5 bg-secondary">
                        {index < Math.ceil(goal.progress / 30) && (
                          <div className="w-3 h-3 bg-primary rounded-full"></div>
                        )}
                      </div>
                      <span className="text-sm text-foreground">{kr}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-4">
                <button className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg border border-border hover:bg-secondary transition-colors duration-200">
                  <Edit2 className="w-4 h-4" />
                  Update Progress
                </button>
                <button className="flex items-center gap-2 px-3 py-1 text-sm rounded-lg border border-border hover:bg-destructive/10 text-destructive transition-colors duration-200">
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Info Banner */}
      <div className="mt-8 p-4 rounded-lg bg-accent/5 border border-accent/20 flex gap-3">
        <AlertCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-foreground mb-1">Pro Tip</p>
          <p className="text-sm text-muted-foreground">
            Keep your goals visible by updating them regularly. Share progress with your manager to get feedback and support.
          </p>
        </div>
      </div>
    </AppLayout>
  )
}

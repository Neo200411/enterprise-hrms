'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState, useEffect, useCallback } from 'react'
import { api } from '@/services/api'
import { AlertCircle, Users } from 'lucide-react'

interface Goal {
  id: string
  employee_id: string
  goal_title: string
  description: string
  thrust_area: string
  uom_type: string
  target_value: number
  weightage: number
  employee_name?: string
  employee_email?: string
}

interface Checkin {
  goal_id: string
  quarter: string
  actual_achievement: number | null
  progress_status: string
}

interface Employee {
  id: string
  name: string
  email: string
}

interface EmployeeCheckinGroup {
  employee: Employee
  goals: Goal[]
  checkins: Record<string, Checkin>
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']

export default function CheckinsReviewPage() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q1')
  const [groups, setGroups] = useState<EmployeeCheckinGroup[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await api.getTeamCheckins(selectedQuarter)
      const goals: Goal[] = data?.goals || []
      const checkins: Checkin[] = data?.checkins || []

      if (!goals || goals.length === 0) {
        setGroups([])
        setIsLoading(false)
        return
      }

      // Group goals + checkins by employee
      const grouped: Record<string, EmployeeCheckinGroup> = {}
      const goalMap = new Map<string, Goal>()
      
      for (const goal of goals) {
        goalMap.set(goal.id, goal)
        const empId = goal.employee_id
        if (!grouped[empId]) {
          const shortId = empId.split('-')[0]
          grouped[empId] = {
            employee: { 
              id: empId, 
              name: goal.employee_name || `Employee (${shortId})`, 
              email: goal.employee_email || empId 
            },
            goals: [],
            checkins: {},
          }
        }
        grouped[empId].goals.push(goal)
      }
      for (const c of checkins) {
        const goal = goalMap.get(c.goal_id)
        if (goal) {
          grouped[goal.employee_id].checkins[c.goal_id] = c
        }
      }

      const result = Object.values(grouped)
      setGroups(result)
      
      // Auto-select first employee if none selected, or if selected is no longer in list
      if (!selectedEmployeeId || !result.find(g => g.employee.id === selectedEmployeeId)) {
        if (result.length > 0) {
          setSelectedEmployeeId(result[0].employee.id)
        } else {
          setSelectedEmployeeId(null)
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load check-in data.')
    } finally {
      setIsLoading(false)
    }
  }, [selectedQuarter, selectedEmployeeId])

  useEffect(() => { fetchData() }, [fetchData])

  const selectedGroup = groups.find(g => g.employee.id === selectedEmployeeId)

  const getCompletionRate = (group: EmployeeCheckinGroup) => {
    const total = group.goals.length
    if (total === 0) return 0
    const withCheckin = Object.keys(group.checkins).length
    return Math.round((withCheckin / total) * 100)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Check-in Reviews</h1>
            <p className="text-sm text-muted-foreground mt-1">Review team quarterly progress updates</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Quarter:</span>
            <div className="flex gap-1 border border-border rounded-lg p-1 bg-card">
              {QUARTERS.map(q => (
                <button key={q} onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedQuarter === q ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            <button className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 rounded-xl bg-secondary animate-pulse" />
            <div className="lg:col-span-2 h-96 rounded-xl bg-secondary animate-pulse" />
          </div>
        ) : groups.length === 0 ? (
          <DashboardCard title="">
            <div className="py-16 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No Check-ins Yet</p>
              <p className="text-sm text-muted-foreground mt-1">No approved goals with check-ins for {selectedQuarter} yet.</p>
            </div>
          </DashboardCard>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Employee List Panel */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold text-foreground">Team Members ({groups.length})</p>
              </div>
              <div className="divide-y divide-border overflow-y-auto max-h-[500px]">
                {groups.map(group => {
                  const completion = getCompletionRate(group)
                  const checkinCount = Object.keys(group.checkins).length
                  const isSelected = group.employee.id === selectedEmployeeId
                  return (
                    <button key={group.employee.id} onClick={() => setSelectedEmployeeId(group.employee.id)}
                      className={`w-full text-left px-4 py-3 transition-colors ${isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-secondary/50 border-l-2 border-transparent'}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                            {group.employee.name || group.employee.email}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">{checkinCount}/{group.goals.length} checked in</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-xs font-bold ${completion === 100 ? 'text-green-600' : completion > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                            {completion}%
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 bg-border rounded-full h-1">
                        <div className={`h-1 rounded-full ${completion === 100 ? 'bg-green-500' : 'bg-primary'}`} style={{ width: `${completion}%` }} />
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Goals Detail Panel */}
            <div className="lg:col-span-2 space-y-4">
              {selectedGroup ? (
                <>
                  <div className="bg-card border border-border rounded-xl px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                        {(selectedGroup.employee.name || selectedGroup.employee.email || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{selectedGroup.employee.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{selectedGroup.employee.email}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-xs text-muted-foreground">Goals Checked In</p>
                        <p className="text-lg font-bold text-foreground">{Object.keys(selectedGroup.checkins).length}/{selectedGroup.goals.length}</p>
                      </div>
                    </div>
                  </div>

                  {selectedGroup.goals.map(goal => {
                    const checkin = selectedGroup.checkins[goal.id]
                    const progress = checkin?.actual_achievement != null && goal.target_value > 0
                      ? Math.min(100, Math.round((checkin.actual_achievement / goal.target_value) * 100)) : 0

                    return (
                      <div key={goal.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{goal.thrust_area}</span>
                              {checkin ? (
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${checkin.progress_status === 'Completed' ? 'bg-green-100 text-green-700' : checkin.progress_status === 'On Track' ? 'bg-blue-50 text-blue-600' : checkin.progress_status === 'Blocked' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                                  {checkin.progress_status}
                                </span>
                              ) : (
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600">Not Submitted</span>
                              )}
                            </div>
                            <h3 className="text-sm font-semibold text-foreground">{goal.goal_title}</h3>
                            <p className="text-xs text-muted-foreground">{goal.description}</p>
                          </div>
                          <p className="text-xs text-muted-foreground flex-shrink-0">{goal.weightage}% weight</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-2.5 bg-secondary/40 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Target</p>
                            <p className="text-sm font-bold text-foreground">{goal.target_value} <span className="text-xs font-normal">{goal.uom_type}</span></p>
                          </div>
                          <div className="p-2.5 bg-secondary/40 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Actual</p>
                            <p className="text-sm font-bold text-foreground">{checkin?.actual_achievement ?? '—'} {checkin ? <span className="text-xs font-normal">{goal.uom_type}</span> : null}</p>
                          </div>
                          <div className="p-2.5 bg-secondary/40 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Progress</p>
                            <p className={`text-sm font-bold ${progress >= 100 ? 'text-green-600' : progress > 50 ? 'text-blue-600' : 'text-foreground'}`}>{checkin ? `${progress}%` : '—'}</p>
                          </div>
                          <div className="p-2.5 bg-secondary/40 rounded-lg text-center">
                            <p className="text-xs text-muted-foreground">Quarter</p>
                            <p className="text-sm font-bold text-foreground">{selectedQuarter}</p>
                          </div>
                        </div>

                        {checkin && (
                          <div className="bg-border rounded-full h-2">
                            <div className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                  Select an employee to view their check-ins
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

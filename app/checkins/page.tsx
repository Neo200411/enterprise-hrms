'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/components/providers/toast-provider'
import { Save, CheckCircle, Clock, Target, AlertCircle, Download, AlertTriangle } from 'lucide-react'
import { toCsv, downloadCsv } from '@/lib/export'

interface Goal {
  id: string
  goal_title: string
  description: string
  thrust_area: string
  uom_type: string
  target_value: number
  weightage: number
}

interface Checkin {
  id?: string
  goal_id: string
  quarter: string
  actual_achievement: number | null
  progress_status: string
}

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4']
const STATUS_OPTIONS = ['Not Started', 'On Track', 'Completed']

export default function CheckinsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [goals, setGoals] = useState<Goal[]>([])
  const [checkins, setCheckins] = useState<Record<string, Checkin>>({})
  const [selectedQuarter, setSelectedQuarter] = useState('Q1')
  const [isLoading, setIsLoading] = useState(true)
  const [savingGoalId, setSavingGoalId] = useState<string | null>(null)
  const [savedGoalIds, setSavedGoalIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const fetchGoals = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    setError(null)
    try {
      const { data, error: goalsError } = await supabase
        .from('goals')
        .select('*')
        .eq('employee_id', user.id)
        .eq('status', 'approved')
        .order('thrust_area')
      if (goalsError) throw goalsError
      setGoals(data || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load approved goals.')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const fetchCheckins = useCallback(async () => {
    if (!user || goals.length === 0) return
    try {
      const goalIds = goals.map(g => g.id)
      const { data } = await supabase
        .from('goal_checkins')
        .select('*')
        .in('goal_id', goalIds)
        .eq('quarter', selectedQuarter)

      const map: Record<string, Checkin> = {}
      for (const c of (data || [])) {
        map[c.goal_id] = {
          id: c.id,
          goal_id: c.goal_id,
          quarter: c.quarter,
          actual_achievement: c.actual_achievement,
          progress_status: c.progress_status || 'Not Started',
        }
      }
      for (const goal of goals) {
        if (!map[goal.id]) {
          map[goal.id] = { goal_id: goal.id, quarter: selectedQuarter, actual_achievement: null, progress_status: 'Not Started' }
        }
      }
      setCheckins(map)
    } catch (err: any) {
      console.error('Error fetching check-ins:', err)
    }
  }, [user, goals, selectedQuarter])

  useEffect(() => { fetchGoals() }, [fetchGoals])
  useEffect(() => { fetchCheckins() }, [fetchCheckins])

  const updateCheckin = (goalId: string, field: keyof Checkin, value: any) => {
    setCheckins(prev => ({ ...prev, [goalId]: { ...prev[goalId], [field]: value } }))
    setSavedGoalIds(prev => { const s = new Set(prev); s.delete(goalId); return s })
  }

  const saveCheckin = async (goalId: string) => {
    setSavingGoalId(goalId)
    const checkin = checkins[goalId]
    if (!checkin) return
    try {
      const payload = {
        goal_id: goalId,
        quarter: selectedQuarter,
        actual_achievement: checkin.actual_achievement ?? 0,
        progress_status: checkin.progress_status,
      }
      if (checkin.id) {
        const { error: updateError } = await supabase.from('goal_checkins').update(payload).eq('id', checkin.id)
        if (updateError) throw updateError
      } else {
        const { data: insertData, error: insertError } = await supabase
          .from('goal_checkins').insert(payload).select('id').single()
        if (insertError) throw insertError
        setCheckins(prev => ({ ...prev, [goalId]: { ...prev[goalId], id: insertData.id } }))
      }
      setSavedGoalIds(prev => new Set(prev).add(goalId))
      toast(`Successfully saved check-in for ${selectedQuarter}!`, 'success')
      setTimeout(() => setSavedGoalIds(prev => { const s = new Set(prev); s.delete(goalId); return s }), 3000)
    } catch (err: any) {
      setError(`Failed to save: ${err.message}`)
      toast(`Failed to save progress: ${err.message}`, 'error')
    } finally {
      setSavingGoalId(null)
    }
  }

  const handleExport = () => {
    const rows = goals.map(goal => {
      const c = checkins[goal.id]
      const progress = c?.actual_achievement != null && goal.target_value > 0
        ? Math.min(100, Math.round((c.actual_achievement / goal.target_value) * 100)) : 0
      return {
        quarter: selectedQuarter,
        thrust_area: goal.thrust_area,
        goal_title: goal.goal_title,
        uom_type: goal.uom_type,
        target_value: goal.target_value,
        actual_achievement: c?.actual_achievement ?? '',
        progress_pct: c ? `${progress}%` : 'Not submitted',
        progress_status: c?.progress_status ?? 'Not submitted',
        weightage: goal.weightage,
      }
    })
    const columns = [
      { key: 'quarter', label: 'Quarter' },
      { key: 'thrust_area', label: 'Thrust Area' },
      { key: 'goal_title', label: 'Goal Title' },
      { key: 'uom_type', label: 'UoM' },
      { key: 'target_value', label: 'Planned Target' },
      { key: 'actual_achievement', label: 'Actual Achievement' },
      { key: 'progress_pct', label: 'Progress %' },
      { key: 'progress_status', label: 'Status' },
      { key: 'weightage', label: 'Weightage (%)' },
    ]
    downloadCsv(toCsv(rows, columns), `checkins-${selectedQuarter}-${Date.now()}.csv`)
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Quarterly Check-in</h1>
            <p className="text-sm text-muted-foreground mt-1">Update your progress on approved goals</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-foreground">Quarter:</span>
            <div className="flex gap-1 border border-border rounded-lg p-1 bg-card">
              {QUARTERS.map(q => (
                <button key={q} onClick={() => setSelectedQuarter(q)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${selectedQuarter === q ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
                  {q}
                </button>
              ))}
            </div>
            {goals.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-3 py-2 bg-card border border-border text-foreground text-sm font-medium rounded-lg hover:bg-secondary transition-colors"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            <button className="ml-auto text-xs underline" onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {!isLoading && goals.length > 0 && (() => {
          const pendingCount = goals.filter(g => {
            const c = checkins[g.id]
            return !c || c.progress_status === 'Not Started' || c.actual_achievement === null
          }).length
          if (pendingCount === 0) return null
          return (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 animate-in fade-in duration-300">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
              <div>
                <h4 className="font-semibold text-sm">Action Required: {pendingCount} Check-in{pendingCount > 1 ? 's' : ''} Pending</h4>
                <p className="text-xs opacity-90 mt-0.5">Please update your actual achievement and progress status for {selectedQuarter} to remain compliant with HR tracking.</p>
              </div>
            </div>
          )
        })()}

        {isLoading ? (
          <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-40 rounded-xl bg-secondary animate-pulse" />)}</div>
        ) : goals.length === 0 ? (
          <DashboardCard title="">
            <div className="py-16 text-center">
              <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-foreground font-medium">No Approved Goals</p>
              <p className="text-sm text-muted-foreground mt-1">Your goals need manager approval before you can check in.</p>
            </div>
          </DashboardCard>
        ) : (
          <div className="space-y-4">
            {goals.map(goal => {
              const checkin = checkins[goal.id] || { goal_id: goal.id, quarter: selectedQuarter, actual_achievement: null, progress_status: 'Not Started' }
              const isSaving = savingGoalId === goal.id
              const isSaved = savedGoalIds.has(goal.id)
              const progress = checkin.actual_achievement != null && goal.target_value > 0
                ? Math.min(100, Math.round((checkin.actual_achievement / goal.target_value) * 100)) : 0

              return (
                <div key={goal.id} className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">{goal.thrust_area}</span>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${checkin.progress_status === 'Completed' ? 'bg-green-100 text-green-700' : checkin.progress_status === 'On Track' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                          {checkin.progress_status}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-foreground mt-1.5">{goal.goal_title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{goal.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground">Weightage</p>
                      <p className="text-lg font-bold text-foreground">{goal.weightage}%</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3 bg-secondary/40 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Planned Target</p>
                      <p className="text-lg font-bold text-foreground">{goal.target_value} <span className="text-xs font-normal text-muted-foreground">{goal.uom_type}</span></p>
                    </div>
                    <div className="p-3 bg-secondary/40 rounded-lg">
                      <label className="text-xs text-muted-foreground mb-1 block">Actual Achievement</label>
                      <input type="number" value={checkin.actual_achievement ?? ''}
                        onChange={e => updateCheckin(goal.id, 'actual_achievement', e.target.value === '' ? null : Number(e.target.value))}
                        placeholder="Enter value"
                        className="w-full text-lg font-bold bg-transparent text-foreground focus:outline-none border-b border-border focus:border-primary transition-colors" />
                    </div>
                    <div className="p-3 bg-secondary/40 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Progress</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-border rounded-full h-2">
                          <div className={`h-2 rounded-full transition-all ${progress >= 100 ? 'bg-green-500' : progress > 50 ? 'bg-blue-500' : 'bg-amber-500'}`} style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-sm font-bold text-foreground">{progress}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">Progress Status</label>
                      <select value={checkin.progress_status}
                        onChange={e => updateCheckin(goal.id, 'progress_status', e.target.value)}
                        className="px-3 py-2 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <button onClick={() => saveCheckin(goal.id)} disabled={isSaving}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${isSaved ? 'bg-green-500/10 text-green-600 border border-green-500/30' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                      {isSaving ? <><Clock className="w-4 h-4 animate-spin" /> Saving...</> : isSaved ? <><CheckCircle className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save Progress</>}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}

'use client'

import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2, Save, Send, AlertCircle } from 'lucide-react'
import { goalSubmissionSchema, GoalSubmission } from '@/lib/validations/goal-schema'
import DashboardCard from '../dashboard/dashboard-card'
import { useAuth } from '../providers/auth-provider'
import { supabase } from '@/lib/supabase'
import { useState } from 'react'

interface GoalFormProps {
  initialData?: GoalSubmission | null
  onSuccess?: () => void
  onCancel?: () => void
}

const defaultGoal = {
  thrust_area: '',
  goal_title: '',
  description: '',
  uom_type: '',
  measurement_type: '',
  target_value: 0,
  weightage: 10,
}

export default function GoalForm({ initialData, onSuccess, onCancel }: GoalFormProps) {
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isValid },
  } = useForm<GoalSubmission>({
    resolver: zodResolver(goalSubmissionSchema),
    defaultValues: initialData || {
      period: 'Q4 2024',
      status: 'draft',
      goals: [defaultGoal],
    },
    mode: 'onChange',
  })

  const { fields, append, remove } = useFieldArray({
    name: 'goals',
    control,
  })

  const watchedGoals = useWatch({
    control,
    name: 'goals',
  })

  const totalWeightage = watchedGoals?.reduce((sum, goal) => sum + (Number(goal.weightage) || 0), 0) || 0

  const onSubmit = async (data: GoalSubmission, action: 'draft' | 'pending_approval') => {
    if (!user) return

    setIsSubmitting(true)
    setGlobalError(null)
    
    // Manual validation for weightage on final submit
    if (action === 'pending_approval' && totalWeightage !== 100) {
      setGlobalError(`Total weightage must be exactly 100%. Current is ${totalWeightage}%`)
      setIsSubmitting(false)
      return
    }

    try {
      data.status = action

      // Delete existing draft/rejected goals for this user to replace them
      const { error: deleteError } = await supabase
        .from('goals')
        .delete()
        .eq('employee_id', user.id)
        .in('status', ['draft', 'rejected'])

      if (deleteError) throw deleteError

      // Insert new goals
      const goalsToInsert = data.goals.map(goal => ({
        employee_id: user.id,
        thrust_area: goal.thrust_area,
        goal_title: goal.goal_title,
        description: goal.description,
        uom_type: goal.uom_type,
        measurement_type: goal.measurement_type,
        target_value: isNaN(Number(goal.target_value)) ? 0 : Number(goal.target_value),
        weightage: isNaN(Number(goal.weightage)) ? 10 : Number(goal.weightage),
        status: data.status,
      }))

      const { error: goalsError } = await supabase
        .from('goals')
        .insert(goalsToInsert)

      if (goalsError) throw goalsError

      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error(err)
      setGlobalError(err.message || 'An error occurred while saving your goals.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardCard title="Create New Goals" className="bg-accent/5 border-accent">
      <form className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="w-1/3">
            <label className="block text-sm font-medium text-foreground mb-2">Period</label>
            <select
              {...register('period')}
              className="w-full px-3 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Q4 2024">Q4 2024</option>
              <option value="Q1 2025">Q1 2025</option>
              <option value="Q2 2025">Q2 2025</option>
            </select>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Weightage</p>
            <p className={`text-2xl font-bold ${totalWeightage === 100 ? 'text-status-success' : 'text-destructive'}`}>
              {totalWeightage}%
            </p>
          </div>
        </div>

        {globalError && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {globalError}
          </div>
        )}
        
        {errors.goals?.root && (
          <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errors.goals.root.message}
          </div>
        )}

        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="p-4 bg-card border border-border rounded-lg shadow-sm relative">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-foreground">Goal #{index + 1}</h3>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                    title="Remove Goal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Thrust Area</label>
                  <select
                    {...register(`goals.${index}.thrust_area`)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Area...</option>
                    <option value="Financial">Financial</option>
                    <option value="Operational">Operational</option>
                    <option value="Customer">Customer</option>
                    <option value="Learning">Learning & Growth</option>
                  </select>
                  {errors.goals?.[index]?.thrust_area && (
                    <p className="text-destructive text-xs mt-1">{errors.goals[index]?.thrust_area?.message}</p>
                  )}
                </div>

                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-foreground mb-1">Goal Title</label>
                  <input
                    type="text"
                    {...register(`goals.${index}.goal_title`)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="E.g., Increase sales by 20%"
                  />
                  {errors.goals?.[index]?.goal_title && (
                    <p className="text-destructive text-xs mt-1">{errors.goals[index]?.goal_title?.message}</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-xs font-medium text-foreground mb-1">Description</label>
                <textarea
                  {...register(`goals.${index}.description`)}
                  rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Detail the expected outcome..."
                />
                {errors.goals?.[index]?.description && (
                  <p className="text-destructive text-xs mt-1">{errors.goals[index]?.description?.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">UoM Type</label>
                  <select
                    {...register(`goals.${index}.uom_type`)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select UoM...</option>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Currency">Currency ($)</option>
                    <option value="Number">Number (#)</option>
                    <option value="Days">Days</option>
                  </select>
                  {errors.goals?.[index]?.uom_type && (
                    <p className="text-destructive text-xs mt-1">{errors.goals[index]?.uom_type?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Measurement</label>
                  <select
                    {...register(`goals.${index}.measurement_type`)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select Type...</option>
                    <option value="Target Based">Target Based</option>
                    <option value="Milestone">Milestone</option>
                    <option value="Continuous">Continuous</option>
                  </select>
                  {errors.goals?.[index]?.measurement_type && (
                    <p className="text-destructive text-xs mt-1">{errors.goals[index]?.measurement_type?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Target Value</label>
                  <input
                    type="number"
                    {...register(`goals.${index}.target_value`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="0"
                  />
                  {errors.goals?.[index]?.target_value && (
                    <p className="text-destructive text-xs mt-1">{errors.goals[index]?.target_value?.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">Weightage (%)</label>
                  <input
                    type="number"
                    {...register(`goals.${index}.weightage`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    min={10}
                    max={100}
                  />
                  {errors.goals?.[index]?.weightage && (
                    <p className="text-destructive text-xs mt-1">{errors.goals[index]?.weightage?.message}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {fields.length < 8 && (
          <button
            type="button"
            onClick={() => append(defaultGoal)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Goal
          </button>
        )}

        <div className="flex gap-3 justify-end pt-4 border-t border-border">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-secondary transition-colors"
            >
              Cancel
            </button>
          )}
          
          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, 'draft'))}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 border border-primary text-primary font-medium rounded-lg hover:bg-primary/10 transition-colors"
          >
            <Save className="w-4 h-4" />
            Save Draft
          </button>
          
          <button
            type="button"
            onClick={handleSubmit((data) => onSubmit(data, 'pending_approval'))}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Send className="w-4 h-4" />
            Submit for Approval
          </button>
        </div>
      </form>
    </DashboardCard>
  )
}

import { z } from 'zod'

export const goalItemSchema = z.object({
  id: z.string().optional(),
  thrust_area: z.string().min(1, 'Thrust area is required'),
  goal_title: z.string().min(3, 'Goal title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  uom_type: z.string().min(1, 'UoM type is required'),
  measurement_type: z.string().min(1, 'Measurement type is required'),
  target_value: z.number({ invalid_type_error: 'Target value must be a number' }).min(1, 'Target must be greater than 0'),
  weightage: z.number({ invalid_type_error: 'Weightage must be a number' }).min(10, 'Minimum weightage for a goal is 10%'),
})

export const goalSubmissionSchema = z.object({
  period: z.string().min(1, 'Period is required'),
  status: z.enum(['draft', 'pending_approval', 'approved', 'rejected']).default('draft'),
  goals: z.array(goalItemSchema)
    .min(1, 'At least one goal is required')
    .max(8, 'Maximum 8 goals allowed'),
}).superRefine((data, ctx) => {
  if (data.status === 'pending_approval') {
    const totalWeight = data.goals.reduce((sum, goal) => sum + (goal.weightage || 0), 0)
    if (totalWeight !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Total weightage must equal exactly 100%. Current total: ${totalWeight}%`,
        path: ['goals_total'],
      })
    }
  }
})

export type GoalItem = z.infer<typeof goalItemSchema>
export type GoalSubmission = z.infer<typeof goalSubmissionSchema>

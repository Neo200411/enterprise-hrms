import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
  action?: {
    label: string
    onClick: () => void
  }
}

export default function DashboardCard({
  title,
  description,
  children,
  className = '',
  action,
}: DashboardCardProps) {
  return (
    <div className={`bg-card border border-border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="px-3 py-1 text-sm font-medium text-primary hover:bg-primary/10 rounded transition-colors duration-200"
          >
            {action.label}
          </button>
        )}
      </div>
      {children}
    </div>
  )
}

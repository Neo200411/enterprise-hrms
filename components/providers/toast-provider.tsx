'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
      default:
        return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
    }
  }

  const getStyle = (type: ToastType) => {
    switch (type) {
      case 'success':
        return 'border-emerald-500/20 bg-emerald-50/90 text-emerald-950 dark:bg-emerald-950/90 dark:text-emerald-50'
      case 'error':
        return 'border-rose-500/20 bg-rose-50/90 text-rose-950 dark:bg-rose-950/90 dark:text-rose-50'
      case 'warning':
        return 'border-amber-500/20 bg-amber-50/90 text-amber-950 dark:bg-amber-950/90 dark:text-amber-50'
      default:
        return 'border-blue-500/20 bg-blue-50/90 text-blue-950 dark:bg-blue-950/90 dark:text-blue-50'
    }
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 max-w-md w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg backdrop-blur-md animate-in slide-in-from-bottom-4 duration-300 pointer-events-auto ${getStyle(
              t.type
            )}`}
          >
            {getIcon(t.type)}
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              onClick={() => removeToast(t.id)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

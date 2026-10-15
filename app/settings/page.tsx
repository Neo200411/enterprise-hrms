'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { api } from '@/services/api'

const ROLE_LABELS: Record<string, string> = {
  employee: 'Employee',
  manager: 'Manager',
  admin: 'Administrator',
}

const EMPTY_PASSWORDS = { current: '', next: '', confirm: '' }

export default function SettingsPage() {
  const { user } = useAuth()
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS)
  const [status, setStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus(null)

    if (passwords.next.length < 8) {
      setStatus({ type: 'error', message: 'New password must be at least 8 characters' })
      return
    }
    if (passwords.next !== passwords.confirm) {
      setStatus({ type: 'error', message: 'New passwords do not match' })
      return
    }

    setIsSaving(true)
    try {
      await api.changePassword({ currentPassword: passwords.current, newPassword: passwords.next })
      setPasswords(EMPTY_PASSWORDS)
      setStatus({ type: 'success', message: 'Password updated successfully' })
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message || 'Failed to update password' })
    } finally {
      setIsSaving(false)
    }
  }

  const inputClass =
    'w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-60'

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Your account details and password</p>
      </div>

      <div className="space-y-6 max-w-3xl">
        <DashboardCard title="Profile">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold uppercase">
              {(user?.name || user?.email || '?').charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-foreground">{user?.name}</p>
              <p className="text-sm text-muted-foreground">{ROLE_LABELS[user?.role || ''] || user?.role}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
              <input type="text" disabled value={user?.name || ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Email</label>
              <input type="email" disabled value={user?.email || ''} className={inputClass} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Contact an administrator to change your name, email or role.</p>
        </DashboardCard>

        <DashboardCard title="Change Password">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {([
                ['current', 'Current password', 'current-password'],
                ['next', 'New password', 'new-password'],
                ['confirm', 'Confirm new password', 'new-password'],
              ] as const).map(([key, label, autoComplete]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-foreground mb-1">{label}</label>
                  <input
                    type="password"
                    autoComplete={autoComplete}
                    value={passwords[key]}
                    onChange={(e) => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                    className={inputClass}
                  />
                </div>
              ))}
            </div>

            {status && (
              <p className={`text-sm ${status.type === 'error' ? 'text-destructive' : 'text-status-success'}`}>
                {status.message}
              </p>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving || !passwords.current || !passwords.next}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                {isSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </DashboardCard>
      </div>
    </AppLayout>
  )
}

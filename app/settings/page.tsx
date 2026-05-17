'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { User, Bell, Lock, LogOut } from 'lucide-react'
import { useState } from 'react'

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    department: 'Engineering',
    notifications: {
      goalUpdates: true,
      reviews: true,
      approvals: true,
      weeklyReport: false,
    },
    privacy: 'public',
  })

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const handleSave = async () => {
    setSaveStatus('saving')
    setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 500)
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and preferences</p>
      </div>

      {/* Profile Section */}
      <DashboardCard
        title="Profile"
        description="Update your personal information"
        className="mb-6"
      >
        <div className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4 pb-4 border-b border-border">
            <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-2xl">
              {settings.fullName.charAt(0)}
            </div>
            <div>
              <p className="font-medium text-foreground">{settings.fullName}</p>
              <p className="text-sm text-muted-foreground">{settings.email}</p>
              <button className="text-sm text-primary hover:text-primary/80 mt-1 font-medium">
                Change Photo
              </button>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={settings.fullName}
                onChange={(e) => setSettings({ ...settings, fullName: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-foreground mb-2">
                Department
              </label>
              <input
                type="text"
                value={settings.department}
                onChange={(e) => setSettings({ ...settings, department: e.target.value })}
                className="w-full px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                disabled
              />
            </div>
          </div>
        </div>
      </DashboardCard>

      {/* Notifications Section */}
      <DashboardCard
        title="Notifications"
        description="Control what updates you receive"
        className="mb-6"
      >
        <div className="space-y-4">
          {[
            {
              key: 'goalUpdates',
              label: 'Goal Updates',
              description: 'Get notified when someone comments on your goals',
            },
            {
              key: 'reviews',
              label: 'Performance Reviews',
              description: 'Receive reminders for review submissions and feedback',
            },
            {
              key: 'approvals',
              label: 'Approvals',
              description: 'Get notifications when your submissions are approved or rejected',
            },
            {
              key: 'weeklyReport',
              label: 'Weekly Report',
              description: 'Receive a weekly summary of your performance metrics',
            },
          ].map((notification) => (
            <label
              key={notification.key}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-secondary/50 cursor-pointer transition-colors duration-200"
            >
              <input
                type="checkbox"
                checked={settings.notifications[notification.key as keyof typeof settings.notifications]}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notifications: {
                      ...settings.notifications,
                      [notification.key]: e.target.checked,
                    },
                  })
                }
                className="w-4 h-4 border border-border rounded bg-input text-primary mt-1 flex-shrink-0"
              />
              <div className="flex-1">
                <p className="font-medium text-foreground">{notification.label}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
              </div>
            </label>
          ))}
        </div>
      </DashboardCard>

      {/* Privacy Section */}
      <DashboardCard
        title="Privacy & Security"
        description="Manage your account security settings"
        className="mb-6"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Profile Visibility
            </label>
            <select
              value={settings.privacy}
              onChange={(e) => setSettings({ ...settings, privacy: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
            >
              <option value="public">Public - Visible to everyone</option>
              <option value="team">Team Only - Visible to your team</option>
              <option value="private">Private - Only visible to you</option>
            </select>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 border border-border text-foreground font-medium rounded-lg hover:bg-secondary transition-colors duration-200">
            <Lock className="w-4 h-4" />
            Change Password
          </button>

          <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
            <p className="text-sm font-medium text-destructive mb-2">Danger Zone</p>
            <button className="text-sm text-destructive hover:text-destructive/80 font-medium">
              Delete Account
            </button>
          </div>
        </div>
      </DashboardCard>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={saveStatus !== 'idle'}
          className={`flex items-center gap-2 px-6 py-2 font-medium rounded-lg transition-all duration-200 ${
            saveStatus === 'saved'
              ? 'bg-status-success text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          } disabled:opacity-50`}
        >
          {saveStatus === 'saving' && <span className="spinner"></span>}
          {saveStatus === 'idle' && 'Save Changes'}
          {saveStatus === 'saved' && '✓ Saved'}
        </button>

        <button className="flex items-center gap-2 px-4 py-2 border border-border text-destructive hover:bg-destructive/5 font-medium rounded-lg transition-colors duration-200">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </AppLayout>
  )
}

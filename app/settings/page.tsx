'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState, useEffect } from 'react'
import { Bell, Lock, User, Save, Shield, Mail } from 'lucide-react'
import { useAuth } from '@/components/providers/auth-provider'
import { api } from '@/services/api'

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Profile Form State
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    role: '',
  })

  // Settings State (Backend Persisted)
  const [notifications, setNotifications] = useState({
    goalUpdates: true,
    approvalNotifications: true,
    weeklySummary: false,
  })

  const [privacy, setPrivacy] = useState('public')

  // Change password form
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordStatus, setPasswordStatus] = useState<{ type: 'error' | 'success'; message: string } | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordStatus(null)

    if (passwords.next.length < 8) {
      setPasswordStatus({ type: 'error', message: 'New password must be at least 8 characters' })
      return
    }
    if (passwords.next !== passwords.confirm) {
      setPasswordStatus({ type: 'error', message: 'New passwords do not match' })
      return
    }

    setIsChangingPassword(true)
    try {
      await api.changePassword({ currentPassword: passwords.current, newPassword: passwords.next })
      setPasswords({ current: '', next: '', confirm: '' })
      setShowPasswordForm(false)
      setPasswordStatus({ type: 'success', message: 'Password updated successfully' })
    } catch (err: any) {
      setPasswordStatus({ type: 'error', message: err.message || 'Failed to update password' })
    } finally {
      setIsChangingPassword(false)
    }
  }

  useEffect(() => {
    // Sync authenticated user profile data
    if (user) {
      setProfile(prev => ({
        ...prev,
        fullName: user.name || '',
        email: user.email || '',
        role: user.role || ''
      }))
    }
  }, [user])

  // Fetch user settings from backend (also used by Cancel to discard unsaved changes)
  const fetchSettings = async () => {
    try {
      setIsLoading(true)
      const data = await api.getUserSettings()
      setNotifications({
        goalUpdates: data.goalUpdates ?? true,
        approvalNotifications: data.approvalNotifications ?? true,
        weeklySummary: data.weeklySummary ?? false,
      })
      setPrivacy(data.profileVisibility ?? 'public')
    } catch (error) {
      console.error('Failed to load settings:', error)
      setErrorMessage('Failed to load settings. Please refresh and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async () => {
    setSaveStatus('saving')
    setErrorMessage(null)
    
    try {
      await api.updateUserSettings({
        goalUpdates: notifications.goalUpdates,
        approvalNotifications: notifications.approvalNotifications,
        weeklySummary: notifications.weeklySummary,
        profileVisibility: privacy
      })
      
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 3000)
    } catch (error: any) {
      console.error('Failed to save settings:', error)
      setSaveStatus('error')
      setErrorMessage(error.message || 'Failed to save settings')
      setTimeout(() => setSaveStatus('idle'), 5000)
    }
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences and settings</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 space-y-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4" />
            Profile Information
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'privacy'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <Shield className="w-4 h-4" />
            Privacy & Security
          </button>
        </div>

        {/* Settings Content */}
        <div className="flex-1">
          <DashboardCard title={
            activeTab === 'profile' ? 'Profile Information' :
            activeTab === 'notifications' ? 'Notification Preferences' :
            'Privacy & Security'
          }>
            {isLoading && activeTab !== 'profile' ? (
              <div className="py-8 text-center text-muted-foreground animate-pulse">
                Loading settings...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold uppercase">
                        {profile.fullName.charAt(0)}
                      </div>
                      <button className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors">
                        Change Avatar
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                        <input
                          type="text"
                          disabled
                          value={profile.fullName}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                        <input
                          type="email"
                          disabled
                          value={profile.email}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Role</label>
                        <input
                          type="text"
                          disabled
                          value={profile.role}
                          className="w-full px-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground capitalize disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-foreground">Goal Updates</p>
                        <p className="text-sm text-muted-foreground">Receive notifications when your goals are approved or commented on.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.goalUpdates}
                          onChange={(e) => setNotifications({ ...notifications, goalUpdates: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-foreground">Approval Reminders</p>
                        <p className="text-sm text-muted-foreground">Get notified when you have pending goals to review.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.approvalNotifications}
                          onChange={(e) => setNotifications({ ...notifications, approvalNotifications: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                      <div>
                        <p className="font-medium text-foreground">Weekly Summary</p>
                        <p className="text-sm text-muted-foreground">Receive a weekly email digest of team performance.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notifications.weeklySummary}
                          onChange={(e) => setNotifications({ ...notifications, weeklySummary: e.target.checked })}
                        />
                        <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                )}

                {/* Privacy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg border border-border">
                      <p className="font-medium text-foreground mb-4">Profile Visibility</p>
                      <div className="space-y-3">
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="privacy"
                            value="public"
                            checked={privacy === 'public'}
                            onChange={(e) => setPrivacy(e.target.value)}
                            className="text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">Public (Company-wide)</p>
                            <p className="text-xs text-muted-foreground">Anyone in the company can see your profile and goals</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="privacy"
                            value="team"
                            checked={privacy === 'team'}
                            onChange={(e) => setPrivacy(e.target.value)}
                            className="text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">Team Only</p>
                            <p className="text-xs text-muted-foreground">Only your direct team and manager can see your goals</p>
                          </div>
                        </label>
                        <label className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="privacy"
                            value="private"
                            checked={privacy === 'private'}
                            onChange={(e) => setPrivacy(e.target.value)}
                            className="text-primary focus:ring-primary"
                          />
                          <div>
                            <p className="text-sm font-medium text-foreground">Private</p>
                            <p className="text-xs text-muted-foreground">Only you and your manager can see your goals</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-secondary/50 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground text-sm">Password</p>
                            <p className="text-xs text-muted-foreground">Change the password you use to sign in</p>
                          </div>
                        </div>
                        {!showPasswordForm && (
                          <button
                            type="button"
                            onClick={() => { setShowPasswordForm(true); setPasswordStatus(null) }}
                            className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
                          >
                            Change Password
                          </button>
                        )}
                      </div>

                      {showPasswordForm && (
                        <form onSubmit={handleChangePassword} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {([
                            ['current', 'Current password', 'current-password'],
                            ['next', 'New password', 'new-password'],
                            ['confirm', 'Confirm new password', 'new-password'],
                          ] as const).map(([key, label, autoComplete]) => (
                            <div key={key}>
                              <label className="block text-xs font-medium text-foreground mb-1">{label}</label>
                              <input
                                type="password"
                                autoComplete={autoComplete}
                                value={passwords[key]}
                                onChange={(e) => setPasswords(prev => ({ ...prev, [key]: e.target.value }))}
                                className="w-full px-3 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground text-sm"
                              />
                            </div>
                          ))}
                          <div className="md:col-span-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => { setShowPasswordForm(false); setPasswords({ current: '', next: '', confirm: '' }); setPasswordStatus(null) }}
                              className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-secondary transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={isChangingPassword || !passwords.current || !passwords.next}
                              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                              {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </button>
                          </div>
                        </form>
                      )}

                      {passwordStatus && (
                        <p className={`text-sm ${passwordStatus.type === 'error' ? 'text-destructive' : 'text-status-success'}`}>
                          {passwordStatus.message}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {saveStatus === 'error' && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                    {errorMessage || 'Failed to save settings. Please try again.'}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-6 border-t border-border mt-8">
                  {activeTab !== 'profile' && (
                    <button
                      onClick={fetchSettings}
                      disabled={saveStatus === 'saving' || isLoading}
                      className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-secondary transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  )}
                  {activeTab !== 'profile' && (
                    <button
                      onClick={handleSave}
                      disabled={saveStatus === 'saving' || isLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
                    </button>
                  )}
                </div>
              </div>
            )}
          </DashboardCard>
        </div>
      </div>
    </AppLayout>
  )
}

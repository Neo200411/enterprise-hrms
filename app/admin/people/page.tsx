'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useEffect, useState } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { api } from '@/services/api'
import { useAuth } from '@/components/providers/auth-provider'
import { useToast } from '@/components/providers/toast-provider'

interface Person {
  id: string
  name: string | null
  email: string
  role: 'employee' | 'manager' | 'admin'
  created_at: string
}

const ROLE_STYLES: Record<Person['role'], string> = {
  admin: 'bg-primary/10 text-primary',
  manager: 'bg-accent/10 text-accent',
  employee: 'bg-muted text-muted-foreground',
}

export default function PeoplePage() {
  const { user, refreshSession } = useAuth()
  const { toast } = useToast()
  const [people, setPeople] = useState<Person[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // The row being edited and its draft name
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draftName, setDraftName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    api.getUsers()
      .then(data => setPeople(data.users || []))
      .catch((err: any) => setError(err.message || 'Failed to load people'))
      .finally(() => setIsLoading(false))
  }, [])

  const startEditing = (person: Person) => {
    setEditingId(person.id)
    setDraftName(person.name || '')
  }

  const saveName = async (person: Person) => {
    setIsSaving(true)
    try {
      const { user: updated } = await api.updateUserName(person.id, draftName)
      setPeople(prev => prev.map(p => (p.id === person.id ? { ...p, name: updated.name } : p)))
      setEditingId(null)
      toast(`Name updated to ${updated.name}`, 'success')
      // Renamed yourself: refresh the header too
      if (person.id === user?.id) await refreshSession({ silent: true })
    } catch (err: any) {
      toast(err.message || 'Failed to update name', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">People</h1>
        <p className="text-muted-foreground">Everyone who can sign in. Click the pencil to change a name.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20">{error}</div>
      )}

      <DashboardCard title={`All People (${people.length})`}>
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-12 rounded-lg bg-secondary animate-pulse" />)}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 pr-4 font-medium">Name</th>
                  <th className="py-2 pr-4 font-medium">Email</th>
                  <th className="py-2 pr-4 font-medium">Role</th>
                  <th className="py-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {people.map(person => (
                  <tr key={person.id}>
                    <td className="py-3 pr-4">
                      {editingId === person.id ? (
                        <form
                          onSubmit={e => { e.preventDefault(); saveName(person) }}
                          className="flex items-center gap-1"
                        >
                          <input
                            autoFocus
                            onFocus={e => e.target.select()}
                            value={draftName}
                            maxLength={100}
                            onChange={e => setDraftName(e.target.value)}
                            onKeyDown={e => e.key === 'Escape' && setEditingId(null)}
                            className="px-2 py-1 border border-border rounded bg-card focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button type="submit" disabled={isSaving || !draftName.trim()} title="Save"
                            className="p-1.5 rounded text-status-success hover:bg-status-success/10 disabled:opacity-50">
                            <Check className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => setEditingId(null)} title="Cancel"
                            className="p-1.5 rounded text-muted-foreground hover:bg-secondary">
                            <X className="w-4 h-4" />
                          </button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-foreground">{person.name || '—'}</span>
                          {person.id === user?.id && <span className="text-xs text-muted-foreground">(you)</span>}
                          <button onClick={() => startEditing(person)} title="Edit name"
                            className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-secondary">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{person.email}</td>
                    <td className="py-3 pr-4">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full capitalize ${ROLE_STYLES[person.role]}`}>{person.role}</span>
                    </td>
                    <td className="py-3 text-muted-foreground">
                      {new Date(person.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </AppLayout>
  )
}

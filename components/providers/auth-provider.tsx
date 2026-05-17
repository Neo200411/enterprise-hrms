'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { useRouter, usePathname } from 'next/navigation'

type Role = 'employee' | 'manager' | 'admin' | null

interface AuthContextType {
  user: User | null
  session: Session | null
  role: Role
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        setRole((session?.user?.user_metadata?.role as Role) ?? null)
      } catch (error) {
        console.error('Error getting session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setRole((session?.user?.user_metadata?.role as Role) ?? null)
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Route protection and redirection
  useEffect(() => {
    if (isLoading) return

    const isAuthRoute = pathname === '/login' || pathname === '/signup'

    if (!user && !isAuthRoute) {
      // Redirect unauthenticated users to login
      router.replace('/login')
      return
    }

    if (user && isAuthRoute) {
      // Redirect authenticated users away from auth routes based on role
      switch (role) {
        case 'admin':
          router.replace('/admin/analytics')
          break
        case 'manager':
          router.replace('/dashboard-manager')
          break
        default:
          router.replace('/')
          break
      }
    }
  }, [user, role, isLoading, pathname, router])

  const signOut = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, session, role, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

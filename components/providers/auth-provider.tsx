'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { api } from '@/services/api'

type Role = 'employee' | 'manager' | 'admin' | null

interface User {
  id: string
  email: string
  name: string
  role: Role
}

interface AuthContextType {
  user: User | null
  role: Role
  isLoading: boolean
  logout: () => void
  refreshSession: (options?: { silent?: boolean }) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  logout: () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

// Pages restricted to certain roles (matched by path prefix). Everything else is open to any signed-in user.
const ROUTE_ROLES: { prefix: string; roles: Role[] }[] = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/approvals', roles: ['manager', 'admin'] },
  { prefix: '/checkins-review', roles: ['manager', 'admin'] },
  { prefix: '/dashboard-manager', roles: ['manager', 'admin'] },
]

const homeForRole = (role: Role) => {
  switch (role) {
    case 'admin':
      return '/admin/analytics'
    case 'manager':
      return '/dashboard-manager'
    default:
      return '/'
  }
}

export const canAccess = (pathname: string, role: Role) => {
  const rule = ROUTE_ROLES.find(r => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
  return !rule || rule.roles.includes(role)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  // silent: re-read the user (e.g. after a name change) without showing the full-page loading state
  const refreshSession = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setIsLoading(true)

    try {
      const token = localStorage.getItem('hr_token')

      // User is not logged in yet
      if (!token) {
        setUser(null)
        setRole(null)
        return
      }

      const { user } = await api.getCurrentUser()

      setUser(user)
      setRole(user.role as Role)
    } catch (error) {
      console.error('Error getting session:', error)

      setUser(null)
      setRole(null)
      localStorage.removeItem('hr_token')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshSession()

    const handleUnauthorized = () => {
      setUser(null)
      setRole(null)
      setIsLoading(false)
      router.replace('/login')
    }

    window.addEventListener('auth-unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized)
    }
  }, [router])

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
      router.replace(homeForRole(role))
      return
    }

    if (user && !canAccess(pathname, role)) {
      // Signed in, but this page belongs to another role
      router.replace(homeForRole(role))
    }
  }, [user, role, isLoading, pathname, router])

  const logout = () => {
    localStorage.removeItem('hr_token')
    setUser(null)
    setRole(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, role, isLoading, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

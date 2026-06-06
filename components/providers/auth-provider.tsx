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
  signOut: () => void
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  isLoading: true,
  signOut: () => {},
  refreshSession: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<Role>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  const refreshSession = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem('hr_token')
      if (!token) {
        throw new Error('No token found')
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

  const signOut = () => {
    localStorage.removeItem('hr_token')
    setUser(null)
    setRole(null)
    router.replace('/login')
  }

  return (
    <AuthContext.Provider value={{ user, role, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

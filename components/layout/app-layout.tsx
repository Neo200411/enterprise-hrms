'use client'

import Sidebar from './sidebar'
import Header from './header'
import { useState } from 'react'
import { useAuth } from '../providers/auth-provider'

interface AppLayoutProps {
  children: React.ReactNode
  userRole?: 'employee' | 'manager' | 'admin'
  userName?: string
}

export default function AppLayout({
  children,
}: AppLayoutProps) {
  const { user, role, isLoading } = useAuth()

  if (isLoading) {
    return <div className="flex h-screen bg-background items-center justify-center">Loading...</div>
  }

  const effectiveRole = role || 'employee'
  const effectiveName = user?.name || user?.email?.split('@')[0] || 'User'

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole={effectiveRole} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header userName={effectiveName} userRole={effectiveRole} />

        {/* Page content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

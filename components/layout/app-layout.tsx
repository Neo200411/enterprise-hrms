'use client'

import Sidebar from './sidebar'
import Header from './header'
import { useState } from 'react'

interface AppLayoutProps {
  children: React.ReactNode
  userRole?: 'employee' | 'manager' | 'admin'
  userName?: string
}

export default function AppLayout({
  children,
  userRole = 'employee',
  userName = 'Jane Smith',
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar userRole={userRole} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header userName={userName} userRole={userRole} />

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

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, BarChart3, Users, Target, CheckCircle2, Clock, Settings, LogOut, CalendarCheck } from 'lucide-react'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: number
}

interface SidebarProps {
  userRole?: 'employee' | 'manager' | 'admin'
}

export default function Sidebar({ userRole = 'employee' }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const getNavItems = (): NavItem[] => {
    const baseItems = [
      {
        label: 'Dashboard',
        href: '/',
        icon: <BarChart3 className="w-5 h-5" />,
      },
      {
        label: 'My Goals',
        href: '/goals',
        icon: <Target className="w-5 h-5" />,
      },
      {
        label: 'Quarterly Check-in',
        href: '/checkins',
        icon: <CalendarCheck className="w-5 h-5" />,
      },
    ]

    const managerItems = [
      {
        label: 'Team Members',
        href: '/team',
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: 'Approvals',
        href: '/approvals',
        icon: <CheckCircle2 className="w-5 h-5" />,
      },
      {
        label: 'Check-in Reviews',
        href: '/checkins-review',
        icon: <CalendarCheck className="w-5 h-5" />,
      },
    ]

    const adminItems = [
      {
        label: 'All Employees',
        href: '/admin/employees',
        icon: <Users className="w-5 h-5" />,
      },
      {
        label: 'Analytics',
        href: '/admin/analytics',
        icon: <BarChart3 className="w-5 h-5" />,
      },
      {
        label: 'Audit Logs',
        href: '/admin/logs',
        icon: <Clock className="w-5 h-5" />,
      },
    ]

    if (userRole === 'admin') {
      return [...baseItems, ...managerItems, ...adminItems]
    } else if (userRole === 'manager') {
      return [...baseItems, ...managerItems]
    }
    return baseItems
  }

  const navItems = getNavItems()

  const isActive = (href: string) => pathname === href

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-primary text-primary-foreground"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 md:hidden z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static top-0 left-0 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 z-40 md:z-0 flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-sidebar-primary rounded-lg flex items-center justify-center font-bold text-sidebar-primary-foreground">
              P
            </div>
            <div>
              <h1 className="font-bold text-lg text-sidebar-foreground">PrimeHR</h1>
              <p className="text-xs text-sidebar-foreground/60">Enterprise HRMS</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                isActive(item.href)
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              }`}
            >
              {item.icon}
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-red-500 text-white rounded-full">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors duration-200"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
          <button
            onClick={() => {
              // Handle logout
              setIsOpen(false)
            }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent/20 transition-colors duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  )
}

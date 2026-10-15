'use client'

import { ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../providers/auth-provider'

interface HeaderProps {
  userName: string
  userRole: 'employee' | 'manager' | 'admin'
}

export default function Header({ userName, userRole }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const { logout } = useAuth()
  const menuRef = useRef<HTMLDivElement>(null)

  // Close the menu when clicking anywhere outside it
  useEffect(() => {
    if (!isDropdownOpen) return
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsDropdownOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isDropdownOpen])

  const getRoleLabel = () => {
    const roles: Record<string, string> = {
      employee: 'Employee',
      manager: 'Manager',
      admin: 'Administrator',
    }
    return roles[userRole]
  }

  return (
    <header className="bg-card border-b border-border h-16 flex items-center justify-between px-6">
      {/* Left side - can add breadcrumbs here */}
      <div>
        {/* Breadcrumbs or page title would go here */}
      </div>

      {/* Right side - notifications and user menu */}
      <div className="flex items-center gap-4">
        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors duration-200"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm">
              {userName.charAt(0).toUpperCase()}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-2 space-y-1">
                <Link
                  href="/settings"
                  onClick={() => setIsDropdownOpen(false)}
                  className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-secondary transition-colors"
                >
                  Settings
                </Link>
                <hr className="my-1 border-border" />
                <button 
                  onClick={() => logout()}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-destructive/10 text-destructive transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

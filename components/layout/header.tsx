'use client'

import { Bell, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface HeaderProps {
  userName: string
  userRole: 'employee' | 'manager' | 'admin'
}

export default function Header({ userName, userRole }: HeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors duration-200">
          <Bell className="w-5 h-5 text-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary transition-colors duration-200"
          >
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <p className="text-xs text-muted-foreground">{getRoleLabel()}</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm">
              {userName.charAt(0)}
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Dropdown menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-50">
              <div className="p-2 space-y-1">
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-secondary transition-colors">
                  Profile
                </button>
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-secondary transition-colors">
                  Settings
                </button>
                <hr className="my-1 border-border" />
                <button className="w-full text-left px-3 py-2 text-sm rounded hover:bg-destructive/10 text-destructive transition-colors">
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

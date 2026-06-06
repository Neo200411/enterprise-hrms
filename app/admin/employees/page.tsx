'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState, useEffect, useMemo } from 'react'
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react'
import { api } from '@/services/api'

interface Employee {
  id: string
  name: string
  email: string
  role: string
  performanceScore: number
  activeGoals: number
  latestActivity: string | null
}

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await api.getEmployees()
      setEmployees(data)
    } catch (err: any) {
      console.error('Failed to fetch employees:', err)
      setError('Failed to load employee directory.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployees()
  }, [])

  const roleCount = useMemo(() => new Set(employees.map(e => e.role)).size, [employees])

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [employees, searchQuery])

  // Aggregate stats
  const activeEmployeesCount = employees.length
  const avgPerformance = employees.length > 0 
    ? Math.round(employees.reduce((acc, emp) => acc + emp.performanceScore, 0) / employees.length)
    : 0

  return (
    <AppLayout userRole="admin">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Employee Directory</h1>
          <p className="text-muted-foreground">Manage and monitor all employees</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors duration-200">
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-between">
          <p>{error}</p>
          <button 
            onClick={fetchEmployees}
            className="px-4 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive font-medium rounded-lg transition-colors text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Total Employees">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-primary">
                {isLoading ? '-' : activeEmployeesCount}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Active accounts</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Roles">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-accent">
                {isLoading ? '-' : roleCount}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Distinct roles</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Avg Performance">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">
                {isLoading ? '-' : `${avgPerformance}%`}
              </p>
              <p className="text-sm text-muted-foreground mt-2">Company average</p>
            </div>
          </div>
        </DashboardCard>
      </div>

      {/* Employees Table */}
      <DashboardCard title="All Employees">
        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, or role..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-input focus:outline-none focus:ring-2 focus:ring-primary text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Active Goals</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Performance</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Latest Activity</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground animate-pulse">
                    Loading employees...
                  </td>
                </tr>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <tr
                    key={employee.id}
                    className="border-b border-border hover:bg-secondary/50 transition-colors duration-200"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm uppercase">
                          {employee.name.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-foreground">{employee.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{employee.email}</td>
                    <td className="px-4 py-3 text-sm text-foreground capitalize">{employee.role}</td>
                    <td className="px-4 py-3 text-sm text-foreground">{employee.activeGoals}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${Math.min(employee.performanceScore, 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-foreground">{employee.performanceScore}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {employee.latestActivity 
                        ? new Date(employee.latestActivity).toLocaleDateString()
                        : 'No activity'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button disabled className="p-1 rounded opacity-50 cursor-not-allowed" title="View (Coming Soon)">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button disabled className="p-1 rounded opacity-50 cursor-not-allowed" title="Edit (Coming Soon)">
                          <Edit2 className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button disabled className="p-1 rounded opacity-50 cursor-not-allowed" title="Delete (Coming Soon)">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </AppLayout>
  )
}

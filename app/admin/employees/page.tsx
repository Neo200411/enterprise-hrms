'use client'

import AppLayout from '@/components/layout/app-layout'
import DashboardCard from '@/components/dashboard/dashboard-card'
import { useState } from 'react'
import { Search, Plus, Edit2, Trash2, Eye } from 'lucide-react'

interface Employee {
  id: string
  name: string
  email: string
  department: string
  role: string
  joinDate: string
  status: 'active' | 'inactive'
  performance: number
}

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [employees] = useState<Employee[]>([
    {
      id: 'EMP001',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      department: 'Engineering',
      role: 'Senior Developer',
      joinDate: '2020-03-15',
      status: 'active',
      performance: 92,
    },
    {
      id: 'EMP002',
      name: 'Bob Smith',
      email: 'bob@example.com',
      department: 'Product',
      role: 'Product Manager',
      joinDate: '2021-01-10',
      status: 'active',
      performance: 85,
    },
    {
      id: 'EMP003',
      name: 'Carol White',
      email: 'carol@example.com',
      department: 'Design',
      role: 'Designer',
      joinDate: '2021-06-20',
      status: 'active',
      performance: 78,
    },
    {
      id: 'EMP004',
      name: 'Diana Chen',
      email: 'diana@example.com',
      department: 'Analytics',
      role: 'Data Analyst',
      joinDate: '2022-02-05',
      status: 'active',
      performance: 88,
    },
    {
      id: 'EMP005',
      name: 'Evan Davis',
      email: 'evan@example.com',
      department: 'HR',
      role: 'HR Specialist',
      joinDate: '2022-09-12',
      status: 'active',
      performance: 82,
    },
  ])

  const filteredEmployees = employees.filter(
    (emp) =>
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchQuery.toLowerCase())
  )

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

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <DashboardCard title="Total Employees">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-primary">{employees.length}</p>
              <p className="text-sm text-muted-foreground mt-2">Active employees</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Departments">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-accent">5</p>
              <p className="text-sm text-muted-foreground mt-2">Teams</p>
            </div>
          </div>
        </DashboardCard>

        <DashboardCard title="Avg Performance">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-4xl font-bold text-status-success">85%</p>
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
            placeholder="Search by name, email, or department..."
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
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Department</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Role</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Performance</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-foreground text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr
                  key={employee.id}
                  className="border-b border-border hover:bg-secondary/50 transition-colors duration-200"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center font-bold text-primary-foreground text-sm">
                        {employee.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-foreground">{employee.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">{employee.email}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{employee.department}</td>
                  <td className="px-4 py-3 text-sm text-foreground">{employee.role}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${employee.performance}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-foreground">{employee.performance}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 text-xs font-medium bg-status-success/10 text-status-success rounded-full">
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button className="p-1 rounded hover:bg-secondary transition-colors duration-200" title="View">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-secondary transition-colors duration-200" title="Edit">
                        <Edit2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button className="p-1 rounded hover:bg-destructive/10 transition-colors duration-200" title="Delete">
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No employees found matching your search</p>
          </div>
        )}
      </DashboardCard>
    </AppLayout>
  )
}

// All calls to the Express backend go through here.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api'

// Sends a request with the saved login token and returns the JSON body (or throws the API's error message)
async function request(path: string, options: { method?: string; body?: unknown } = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hr_token') : null

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  // Token missing or expired: clear it and let the AuthProvider send the user to /login
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('hr_token')
    window.dispatchEvent(new Event('auth-unauthorized'))
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
  }

  return response.json()
}

export const api = {
  // --- Auth ---
  login: (credentials: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: credentials }),
  register: (data: { email: string; password: string; name: string }) =>
    request('/auth/register', { method: 'POST', body: data }),
  getCurrentUser: () => request('/auth/me'),
  updateMyName: (name: string) => request('/auth/me', { method: 'PUT', body: { name } }),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request('/auth/password', { method: 'PUT', body: data }),

  // --- Goals (employee) ---
  getGoals: () => request('/goals'),
  submitGoals: (data: unknown) => request('/goals/submit', { method: 'POST', body: data }),

  // --- Approvals (manager) ---
  getPendingApprovals: () => request('/approvals/pending'),
  updateSubmissionStatus: (submissionId: string, actionData: unknown) =>
    request(`/approvals/submissions/${submissionId}/action`, { method: 'PUT', body: actionData }),

  // --- Quarterly check-ins ---
  // period like "Q4 2026"; leave it out to get the most recent period with approved goals
  getMyCheckins: (period?: string) =>
    request(`/checkins/my-checkins${period ? `?period=${encodeURIComponent(period)}` : ''}`),
  submitCheckin: (data: unknown) => request('/checkins', { method: 'POST', body: data }),
  getTeamCheckins: (period?: string) =>
    request(`/checkins/team${period ? `?period=${encodeURIComponent(period)}` : ''}`),

  // --- Reports & dashboards ---
  getEmployeeDashboard: () => request('/reports/employee-dashboard'),
  getManagerDashboard: () => request('/reports/manager-dashboard'),
  getAnalyticsDashboard: () => request('/reports/admin-dashboard'),
  exportAnalytics: () => request('/reports/export'),
  getAuditLogs: (limit = 100) => request(`/reports/audit-logs?limit=${limit}`),

  // --- People (admin) ---
  getUsers: () => request('/users'),
  updateUserName: (userId: string, name: string) =>
    request(`/users/${userId}/name`, { method: 'PUT', body: { name } }),
}

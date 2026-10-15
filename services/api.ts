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
  getMyCheckins: (quarter: string) => request(`/checkins/my-checkins?quarter=${quarter}`),
  submitCheckin: (data: unknown) => request('/checkins', { method: 'POST', body: data }),
  getTeamCheckins: (quarter: string) => request(`/checkins/team?quarter=${quarter}`),

  // --- Reports & dashboards ---
  getEmployeeDashboard: () => request('/reports/employee-dashboard'),
  getManagerDashboard: () => request('/reports/manager-dashboard'),
  getTeamMembers: (page = 1, limit = 10) => request(`/reports/team?page=${page}&limit=${limit}`),
  getAnalyticsDashboard: () => request('/reports/admin-dashboard'),
  getEmployees: () => request('/reports/employees'),
  exportAnalytics: () => request('/reports/export'),
  getAuditLogs: (limit = 100) => request(`/reports/audit-logs?limit=${limit}`),
}

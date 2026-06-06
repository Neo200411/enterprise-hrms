const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('hr_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('hr_token');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

export const api = {
  // --- Auth ---
  login: async (credentials: any) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    return handleResponse(res);
  },
  
  register: async (data: any) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getCurrentUser: async () => {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // --- Goals (Employee) ---
  getGoals: async () => {
    const res = await fetch(`${API_URL}/goals`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitGoals: async (data: any) => {
    const res = await fetch(`${API_URL}/goals/submit`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  // --- Approvals (Manager) ---
  getPendingApprovals: async () => {
    const res = await fetch(`${API_URL}/approvals/pending`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  updateSubmissionStatus: async (submissionId: string, actionData: any) => {
    const res = await fetch(`${API_URL}/approvals/submissions/${submissionId}/action`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(actionData)
    });
    return handleResponse(res);
  },

  // --- Check-ins (Employee & Manager) ---
  getMyCheckins: async (quarter: string) => {
    const res = await fetch(`${API_URL}/checkins/my-checkins?quarter=${quarter}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitCheckin: async (data: any) => {
    const res = await fetch(`${API_URL}/checkins`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getTeamCheckins: async (quarter: string) => {
    const res = await fetch(`${API_URL}/checkins/team?quarter=${quarter}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // --- Analytics (Admin) ---
  getAnalyticsDashboard: async () => {
    const res = await fetch(`${API_URL}/analytics/dashboard`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  exportAnalytics: async () => {
    const res = await fetch(`${API_URL}/analytics/export`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  }
};

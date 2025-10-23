import api from '../lib/api';

export interface BugReport {
  _id: string;
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  ipAddress?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBugReportData {
  name: string;
  email: string;
  message: string;
}

export interface BugReportResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    status: string;
    createdAt: string;
  };
}

export const bugReportsApi = {
  // Submit a new bug report
  submit: async (data: CreateBugReportData): Promise<BugReportResponse> => {
    const response = await api.post('/bug-reports', data);
    // normalize response
    return response.data;
  },

  // Get all bug reports for current user (or by email when provided)
  getMyReports: async (email?: string): Promise<BugReport[]> => {
    console.log('🌐 API: Fetching bug reports with email:', email);
    const params = email ? { email } : {};
    console.log('📤 API: Request params:', params);
    const response = await api.get('/bug-reports', { params });
    console.log('📥 API: Response received:', response.data);
    // backend returns { success: true, data: [...] }
    return response.data?.data || [];
  },

  // Get a specific bug report
  getById: async (id: string): Promise<BugReport> => {
    const response = await api.get(`/bug-reports/${id}`);
    return response.data.data;
  },

  // Delete a bug report
  delete: async (id: string): Promise<void> => {
    await api.delete(`/bug-reports/${id}`);
  },
};
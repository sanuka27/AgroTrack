/**
 * Bug Reports API Module
 * 
 * Handles bug report submissions from users:
 * - Submit new bug reports
 * - Get user's bug reports
 * - Get single bug report
 * - Delete bug report
 * 
 * Backend Endpoints: /api/bug-reports
 * MongoDB Collection: bugreports
 */

import api, { getErrorMessage } from '../api';

/**
 * Bug report type
 */
export interface BugReport {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  description: string;
  status: 'new' | 'investigating' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: {
    _id: string;
    name: string;
  };
  attachments?: string[];
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

interface BugReportsListResponse {
  success: boolean;
  data: {
    reports: BugReport[];
    total?: number;
  };
}

interface BugReportResponse {
  success: boolean;
  data: {
    report: BugReport;
  };
}

/**
 * Bug Reports API Service
 */
export const bugReportsApi = {
  /**
   * Submit a new bug report
   * 
   * POST /api/bug-reports
   * 
   * @param reportData - Bug report data with optional attachments
   * @returns Promise with created bug report
   */
  async submitBugReport(reportData: {
    name: string;
    email: string;
    description: string;
    attachments?: File[];
  }): Promise<BugReport> {
    try {
      const formData = new FormData();
      
      formData.append('name', reportData.name);
      formData.append('email', reportData.email);
      formData.append('description', reportData.description);
      
      // Add attachments if any
      if (reportData.attachments) {
        reportData.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
      }

      const response = await api.post<BugReportResponse>('/bug-reports', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data.data.report;
    } catch (error) {
      console.error('Error submitting bug report:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get all bug reports for current user
   * 
   * GET /api/bug-reports
   * 
   * @returns Promise with array of bug reports
   */
  async getMyBugReports(): Promise<BugReport[]> {
    try {
      const response = await api.get<BugReportsListResponse>('/bug-reports');
      return response.data.data.reports;
    } catch (error) {
      console.error('Error fetching bug reports:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single bug report by ID
   * 
   * GET /api/bug-reports/:id
   * 
   * @param id - Bug report ID
   * @returns Promise with bug report data
   */
  async getBugReport(id: string): Promise<BugReport> {
    try {
      const response = await api.get<BugReportResponse>(`/bug-reports/${id}`);
      return response.data.data.report;
    } catch (error) {
      console.error('Error fetching bug report:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a bug report
   * 
   * DELETE /api/bug-reports/:id
   * 
   * @param id - Bug report ID
   * @returns Promise that resolves when bug report is deleted
   */
  async deleteBugReport(id: string): Promise<void> {
    try {
      await api.delete(`/bug-reports/${id}`);
    } catch (error) {
      console.error('Error deleting bug report:', getErrorMessage(error));
      throw error;
    }
  },
};

/**
 * Care Logs API Module
 * 
 * This module provides API methods for care log operations:
 * - Get care logs for a plant or user
 * - Create new care log
 * - Update care log
 * - Delete care log
 * - Upload care log photos
 * 
 * Backend Endpoints: /api/care-logs
 * MongoDB Collection: carelogs
 */

import api, { getErrorMessage } from '../api';
import type { CareLog } from '@/types/care';

// Care logs list response
interface CareLogsListResponse {
  careLogs: CareLog[];
  total: number;
  page: number;
  limit: number;
}

// Single care log response
interface CareLogResponse {
  careLog: CareLog;
}

/**
 * Care Logs API Service
 */
export const careLogsApi = {
  /**
   * Get care logs
   * 
   * @param params - Query parameters for filtering
   * @returns Promise with array of care logs
   * 
   * Example:
   * ```typescript
   * const logs = await careLogsApi.getCareLogs({ plantId: '123', careType: 'watering' });
   * ```
   */
  async getCareLogs(params?: {
    plantId?: string;
    userId?: string;
    careType?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<CareLog[]> {
    try {
      const response = await api.get<CareLogsListResponse>('/care-logs', { params });
      return response.data.careLogs || [];
    } catch (error) {
      console.error('Failed to fetch care logs:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single care log by ID
   * 
   * @param id - Care log ID
   * @returns Promise with care log data
   */
  async getCareLogById(id: string): Promise<CareLog> {
    try {
      const response = await api.get<CareLogResponse>(`/care-logs/${id}`);
      if (!response.data.careLog) {
        throw new Error('Care log not found');
      }
      return response.data.careLog;
    } catch (error) {
      console.error('Failed to fetch care log:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Create a new care log
   * 
   * @param careLogData - Care log data (can be FormData for photo upload)
   * @returns Promise with created care log
   * 
   * Example:
   * ```typescript
   * const formData = new FormData();
   * formData.append('plantId', '123');
   * formData.append('careType', 'watering');
   * formData.append('notes', 'Watered thoroughly');
   * formData.append('photos', photoFile);
   * 
   * const newLog = await careLogsApi.createCareLog(formData);
   * ```
   */
  async createCareLog(careLogData: FormData | Partial<CareLog>): Promise<CareLog> {
    try {
      const headers = careLogData instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : {};

      const response = await api.post<CareLogResponse>(
        '/care-logs',
        careLogData,
        { headers }
      );

      if (!response.data.careLog) {
        throw new Error('Failed to create care log');
      }

      return response.data.careLog;
    } catch (error) {
      console.error('Failed to create care log:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update an existing care log
   * 
   * @param id - Care log ID
   * @param careLogData - Updated care log data
   * @returns Promise with updated care log
   */
  async updateCareLog(id: string, careLogData: FormData | Partial<CareLog>): Promise<CareLog> {
    try {
      const headers = careLogData instanceof FormData 
        ? { 'Content-Type': 'multipart/form-data' }
        : {};

      const response = await api.put<CareLogResponse>(
        `/care-logs/${id}`,
        careLogData,
        { headers }
      );

      if (!response.data.careLog) {
        throw new Error('Failed to update care log');
      }

      return response.data.careLog;
    } catch (error) {
      console.error('Failed to update care log:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a care log
   * 
   * @param id - Care log ID
   * @returns Promise that resolves when care log is deleted
   */
  async deleteCareLog(id: string): Promise<void> {
    try {
      await api.delete(`/care-logs/${id}`);
    } catch (error) {
      console.error('Failed to delete care log:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get care logs for a specific plant
   * 
   * @param plantId - Plant ID
   * @param limit - Maximum number of logs to return
   * @returns Promise with array of care logs
   */
  async getPlantCareLogs(plantId: string, limit?: number): Promise<CareLog[]> {
    return this.getCareLogs({ plantId, limit });
  },

  /**
   * Get recent care logs for user
   * 
   * @param limit - Maximum number of logs to return
   * @returns Promise with array of recent care logs
   */
  async getRecentCareLogs(limit: number = 10): Promise<CareLog[]> {
    return this.getCareLogs({ limit });
  },

  /**
   * Get care log statistics
   * 
   * @param plantId - Optional plant ID to get stats for specific plant
   * @returns Promise with care statistics
   */
  async getCareStats(plantId?: string): Promise<{
    totalLogs: number;
    byType: Record<string, number>;
    lastCareDate?: Date;
  }> {
    try {
      const params = plantId ? { plantId } : {};
      const response = await api.get('/care-logs/stats', { params });
      return response.data || { totalLogs: 0, byType: {} };
    } catch (error) {
      console.error('Failed to get care stats:', getErrorMessage(error));
      throw error;
    }
  },
};

export default careLogsApi;

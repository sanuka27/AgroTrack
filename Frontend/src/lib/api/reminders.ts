/**
 * Reminders API Module
 * 
 * Handles all reminder-related API operations:
 * - Get user reminders
 * - Create new reminder
 * - Update reminder
 * - Delete reminder
 * - Complete reminder
 * - Snooze reminder
 * 
 * Backend Endpoints: /api/reminders
 * MongoDB Collection: reminders
 */

import api, { getErrorMessage } from '../api';

/**
 * Reminder type
 */
export interface Reminder {
  _id: string;
  userId: string;
  title: string;
  dueAt: string;
  notes?: string;
  plantId?: string | null;
  completed: boolean;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface RemindersListResponse {
  success: boolean;
  data: {
    reminders: Reminder[];
    total?: number;
  };
}

interface ReminderResponse {
  success: boolean;
  data: {
    reminder: Reminder;
  };
}

/**
 * Reminders API Service
 */
export const remindersApi = {
  /**
   * Get all reminders for authenticated user
   * 
   * GET /api/reminders
   * 
   * @param filters - Optional filters
   * @returns Promise with array of reminders
   */
  async getReminders(filters?: {
    plantId?: string;
    status?: 'pending' | 'completed';
    upcoming?: boolean;
    overdue?: boolean;
  }): Promise<Reminder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.plantId) params.append('plantId', filters.plantId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.upcoming) params.append('upcoming', 'true');
  if (filters?.overdue) params.append('overdue', 'true');

      const response = await api.get<RemindersListResponse>(`/reminders?${params.toString()}`);
      return response.data.data.reminders;
    } catch (error) {
      console.error('Error fetching reminders:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single reminder by ID
   * 
   * GET /api/reminders/:id
   * 
   * @param id - Reminder ID
   * @returns Promise with reminder data
   */
  async getReminder(id: string): Promise<Reminder> {
    try {
      const response = await api.get<ReminderResponse>(`/reminders/${id}`);
      return response.data.data.reminder;
    } catch (error) {
      console.error('Error fetching reminder:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Create a new reminder
   * 
   * POST /api/reminders
   * 
   * @param reminderData - Reminder data
   * @returns Promise with created reminder
   */
  async createReminder(reminderData: {
    title: string;
    dueAt: string;
    notes?: string;
    plantId?: string;
  }): Promise<Reminder> {
    try {
      const response = await api.post<ReminderResponse>('/reminders', reminderData);
      return response.data.data.reminder;
    } catch (error) {
      console.error('Error creating reminder:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Update an existing reminder
   * 
   * PUT /api/reminders/:id
   * 
   * @param id - Reminder ID
   * @param reminderData - Updated reminder data
   * @returns Promise with updated reminder
   */
  async updateReminder(
    id: string,
    reminderData: Partial<{ title: string; dueAt: string; notes: string; plantId: string }>
  ): Promise<Reminder> {
    try {
      const response = await api.put<ReminderResponse>(`/reminders/${id}`, reminderData);
      return response.data.data.reminder;
    } catch (error) {
      console.error('Error updating reminder:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Delete a reminder
   * 
   * DELETE /api/reminders/:id
   * 
   * @param id - Reminder ID
   * @returns Promise that resolves when reminder is deleted
   */
  async deleteReminder(id: string): Promise<void> {
    try {
      await api.delete(`/reminders/${id}`);
    } catch (error) {
      console.error('Error deleting reminder:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Mark a reminder as completed
   * 
   * POST /api/reminders/:id/complete
   * 
   * @param id - Reminder ID
   * @param notes - Optional completion notes
   * @returns Promise with updated reminder
   */
  async completeReminder(id: string, _notes?: string): Promise<Reminder> {
    try {
      const response = await api.post<ReminderResponse>(`/reminders/${id}/complete`, { notes: _notes });
      return response.data.data.reminder;
    } catch (error) {
      console.error('Error completing reminder:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Snooze a reminder
   * 
   * POST /api/reminders/:id/snooze
   * 
   * @param id - Reminder ID
   * @param snoozeUntil - Date/time to snooze until
   * @returns Promise with updated reminder
   */
  async snoozeReminder(id: string, snoozeUntil: string): Promise<Reminder> {
    try {
      // backend expects hours; compute hours between now and snoozeUntil
      const hours = Math.max(1, Math.round((new Date(snoozeUntil).getTime() - Date.now()) / (60 * 60 * 1000)));
      const response = await api.post<ReminderResponse>(`/reminders/${id}/snooze`, { hours });
      return response.data.data.reminder;
    } catch (error) {
      console.error('Error snoozing reminder:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get upcoming reminders (due within next 7 days)
   * 
   * GET /api/reminders/upcoming
   * 
   * @returns Promise with array of upcoming reminders
   */
  async getUpcomingReminders(): Promise<Reminder[]> {
    try {
      const response = await api.get<RemindersListResponse>('/reminders?upcoming=true&status=pending');
      return response.data.data.reminders;
    } catch (error) {
      console.error('Error fetching upcoming reminders:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get overdue reminders
   * 
   * GET /api/reminders/overdue
   * 
   * @returns Promise with array of overdue reminders
   */
  async getOverdueReminders(): Promise<Reminder[]> {
    try {
      const response = await api.get<RemindersListResponse>('/reminders?overdue=true&status=pending');
      return response.data.data.reminders;
    } catch (error) {
      console.error('Error fetching overdue reminders:', getErrorMessage(error));
      throw error;
    }
  },
};

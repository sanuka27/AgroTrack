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
  plantId: string;
  title: string;
  description?: string;
  reminderType: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pest_control' | 'custom';
  frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
  customFrequencyDays?: number;
  nextDueDate: string;
  lastCompletedDate?: string;
  status: 'pending' | 'completed' | 'snoozed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  isRecurring: boolean;
  notificationChannels?: Array<'push' | 'email' | 'sms'>;
  completedCount?: number;
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
    status?: string;
    reminderType?: string;
    upcoming?: boolean; // Get only upcoming reminders
  }): Promise<Reminder[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.plantId) params.append('plantId', filters.plantId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.reminderType) params.append('reminderType', filters.reminderType);
      if (filters?.upcoming) params.append('upcoming', 'true');

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
    plantId: string;
    title: string;
    description?: string;
    reminderType: 'watering' | 'fertilizing' | 'pruning' | 'repotting' | 'pest_control' | 'custom';
    frequency?: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'custom';
    customFrequencyDays?: number;
    nextDueDate: string;
    priority?: 'low' | 'medium' | 'high';
    isRecurring?: boolean;
    notificationChannels?: Array<'push' | 'email' | 'sms'>;
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
    reminderData: Partial<{
      title: string;
      description: string;
      reminderType: string;
      frequency: string;
      customFrequencyDays: number;
      nextDueDate: string;
      priority: string;
      isRecurring: boolean;
      notificationChannels: Array<'push' | 'email' | 'sms'>;
    }>
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
  async completeReminder(id: string, notes?: string): Promise<Reminder> {
    try {
      const response = await api.post<ReminderResponse>(`/reminders/${id}/complete`, { notes });
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
      const response = await api.post<ReminderResponse>(`/reminders/${id}/snooze`, { snoozeUntil });
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

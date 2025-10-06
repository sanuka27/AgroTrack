/**
 * Contact API Module
 * 
 * Handles contact form submissions:
 * - Submit new contact message
 * - Get user's contact messages
 * - Get single contact message
 * 
 * Backend Endpoints: /api/contact
 * MongoDB Collection: contactmessages
 */

import api, { getErrorMessage } from '../api';

/**
 * Contact message type
 */
export interface ContactMessage {
  _id: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'in_progress' | 'responded' | 'closed';
  priority: 'low' | 'normal' | 'high';
  response?: string;
  respondedAt?: string;
  respondedBy?: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ContactMessagesListResponse {
  success: boolean;
  data: {
    messages: ContactMessage[];
    total?: number;
  };
}

interface ContactMessageResponse {
  success: boolean;
  data: {
    message: ContactMessage;
  };
}

/**
 * Contact API Service
 */
export const contactApi = {
  /**
   * Submit a new contact message
   * 
   * POST /api/contact
   * 
   * @param messageData - Contact message data
   * @returns Promise with created contact message
   */
  async submitContactMessage(messageData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<ContactMessage> {
    try {
      const response = await api.post<ContactMessageResponse>('/contact', messageData);
      return response.data.data.message;
    } catch (error) {
      console.error('Error submitting contact message:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get all contact messages for current user
   * 
   * GET /api/contact
   * 
   * @returns Promise with array of contact messages
   */
  async getMyContactMessages(): Promise<ContactMessage[]> {
    try {
      const response = await api.get<ContactMessagesListResponse>('/contact');
      return response.data.data.messages;
    } catch (error) {
      console.error('Error fetching contact messages:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get a single contact message by ID
   * 
   * GET /api/contact/:id
   * 
   * @param id - Contact message ID
   * @returns Promise with contact message data
   */
  async getContactMessage(id: string): Promise<ContactMessage> {
    try {
      const response = await api.get<ContactMessageResponse>(`/contact/${id}`);
      return response.data.data.message;
    } catch (error) {
      console.error('Error fetching contact message:', getErrorMessage(error));
      throw error;
    }
  },
};

/**
 * AI Chat API Module
 * 
 * Handles AI-powered plant care chat:
 * - Send messages to AI assistant
 * - Get chat history
 * - Get recent chat sessions
 * - Provide feedback on AI responses
 * 
 * Backend Endpoints: /api/ai/chat
 * MongoDB Collection: chatmessages
 */

import api, { getErrorMessage } from '../api';

/**
 * Chat message type
 */
export interface ChatMessage {
  _id: string;
  userId: string;
  sessionId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    plantId?: string;
    careType?: string;
    suggestions?: string[];
    confidence?: number;
  };
  model: string;
  tokens?: number;
  helpful?: boolean;
  feedbackComment?: string;
  createdAt: string;
}

/**
 * Chat session type
 */
export interface ChatSession {
  sessionId: string;
  lastMessage: string;
  lastMessageDate: string;
  messageCount: number;
}

interface ChatResponse {
  success: boolean;
  data: {
    message: ChatMessage;
    response: ChatMessage;
  };
}

interface ChatHistoryResponse {
  success: boolean;
  data: {
    messages: ChatMessage[];
    sessionId: string;
  };
}

interface ChatSessionsResponse {
  success: boolean;
  data: {
    sessions: ChatSession[];
  };
}

/**
 * AI Chat API Service
 */
export const aiChatApi = {
  /**
   * Send a message to AI assistant
   * 
   * POST /api/ai/chat
   * 
   * @param messageData - Message data
   * @returns Promise with AI response
   */
  async sendMessage(messageData: {
    content: string;
    sessionId?: string;
    plantId?: string;
    careType?: string;
  }): Promise<{
    userMessage: ChatMessage;
    aiResponse: ChatMessage;
  }> {
    try {
      const response = await api.post<ChatResponse>('/ai/chat', messageData);
      return {
        userMessage: response.data.data.message,
        aiResponse: response.data.data.response,
      };
    } catch (error) {
      console.error('Error sending message:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get chat history for a session
   * 
   * GET /api/ai/chat/history
   * 
   * @param sessionId - Session ID (optional, gets latest session if not provided)
   * @returns Promise with chat history
   */
  async getChatHistory(sessionId?: string): Promise<{
    messages: ChatMessage[];
    sessionId: string;
  }> {
    try {
      const url = sessionId ? `/ai/chat/history?sessionId=${sessionId}` : '/ai/chat/history';
      const response = await api.get<ChatHistoryResponse>(url);
      return {
        messages: response.data.data.messages,
        sessionId: response.data.data.sessionId,
      };
    } catch (error) {
      console.error('Error fetching chat history:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Get recent chat sessions
   * 
   * GET /api/ai/chat/sessions
   * 
   * @returns Promise with array of recent sessions
   */
  async getRecentSessions(): Promise<ChatSession[]> {
    try {
      const response = await api.get<ChatSessionsResponse>('/ai/chat/sessions');
      return response.data.data.sessions;
    } catch (error) {
      console.error('Error fetching sessions:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Provide feedback on an AI message
   * 
   * POST /api/ai/chat/feedback
   * 
   * @param messageId - Message ID
   * @param feedback - Feedback data
   * @returns Promise that resolves when feedback is saved
   */
  async provideFeedback(
    messageId: string,
    feedback: {
      helpful: boolean;
      comment?: string;
    }
  ): Promise<void> {
    try {
      await api.post('/ai/chat/feedback', {
        messageId,
        ...feedback,
      });
    } catch (error) {
      console.error('Error providing feedback:', getErrorMessage(error));
      throw error;
    }
  },

  /**
   * Start a new chat session
   * 
   * POST /api/ai/chat/new-session
   * 
   * @returns Promise with new session ID
   */
  async startNewSession(): Promise<string> {
    try {
      const response = await api.post<{ success: boolean; data: { sessionId: string } }>(
        '/ai/chat/new-session'
      );
      return response.data.data.sessionId;
    } catch (error) {
      console.error('Error starting new session:', getErrorMessage(error));
      throw error;
    }
  },
};

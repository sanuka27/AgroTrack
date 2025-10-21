import api, { getErrorMessage } from '../api';

export interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export const notificationsApi = {
  async createNotification(payload: { type: string; title: string; message: string; data?: any }) {
    try {
      const resp = await api.post('/notifications', payload);
      return resp.data;
    } catch (err) {
      console.error('Error creating notification:', getErrorMessage(err));
      throw err;
    }
  },

  async getNotifications(params?: { page?: number; limit?: number }) {
    try {
      const q = new URLSearchParams();
      if (params?.page) q.append('page', String(params.page));
      if (params?.limit) q.append('limit', String(params.limit));
      const resp = await api.get(`/notifications?${q.toString()}`);
      return resp.data.data;
    } catch (err) {
      console.error('Error fetching notifications:', getErrorMessage(err));
      throw err;
    }
  }
  ,
  async markAsRead(id: string) {
    try {
      const resp = await api.patch(`/notifications/${id}/read`);
      return resp.data;
    } catch (err) {
      console.error('Error marking notification as read:', getErrorMessage(err));
      throw err;
    }
  },
  async markAllRead() {
    try {
      const resp = await api.patch('/notifications/mark-all-read');
      return resp.data;
    } catch (err) {
      console.error('Error marking all notifications as read:', getErrorMessage(err));
      throw err;
    }
  },
  async deleteNotification(id: string) {
    try {
      const resp = await api.delete(`/notifications/${id}`);
      return resp.data;
    } catch (err) {
      console.error('Error deleting notification:', getErrorMessage(err));
      throw err;
    }
  }
};

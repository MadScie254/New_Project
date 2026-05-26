import { create } from 'zustand';
import api from '../lib/api';

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  chama?: { name: string };
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const [listRes, countRes] = await Promise.all([
        api.get('/notifications'),
        api.get('/notifications/unread-count')
      ]);
      set({ 
        notifications: listRes.data, 
        unreadCount: countRes.data.count 
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      set((state) => {
        const notifs = state.notifications.map((n) => 
          n.id === id ? { ...n, read: true } : n
        );
        return { 
          notifications: notifs,
          unreadCount: Math.max(0, state.unreadCount - 1)
        };
      });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }
}));

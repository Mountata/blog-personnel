import { create } from 'zustand';
import API from '../utils/axios';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount:   0,

  fetchNotifications: async () => {
    try {
      const { data } = await API.get('/notifications');
      set({
        notifications: data.notifications,
        unreadCount:   data.unreadCount
      });
    } catch (error) {
      console.error(error);
    }
  },

  markAsRead: async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      set((state) => ({
        notifications: state.notifications.map(n =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (error) {
      console.error(error);
    }
  },

  markAllAsRead: async () => {
    try {
      await API.put('/notifications/read-all');
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount:   0
      }));
    } catch (error) {
      console.error(error);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount:   state.unreadCount + 1
    }));
  },
}));

export default useNotificationStore;
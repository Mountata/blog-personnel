import { create } from 'zustand';
import API from '../utils/axios';

const useMessageStore = create((set, get) => ({
  conversations:  [],
  messages:       [],
  activeUser:     null,
  unreadCount:    0,

  fetchConversations: async () => {
    try {
      const { data } = await API.get('/messages/conversations');
      set({ conversations: data });
    } catch (error) {
      console.error(error);
    }
  },

  fetchMessages: async (userId) => {
    try {
      const { data } = await API.get(`/messages/${userId}`);
      set({ messages: data, activeUser: userId });
    } catch (error) {
      console.error(error);
    }
  },

  sendMessage: async (userId, text, image) => {
    try {
      const formData = new FormData();
      formData.append('text', text);
      if (image) formData.append('image', image);

      const { data } = await API.post(`/messages/${userId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      set((state) => ({ messages: [...state.messages, data] }));
      return data;
    } catch (error) {
      console.error(error);
    }
  },

  addMessage: (message) => {
    set((state) => ({ messages: [...state.messages, message] }));
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await API.get('/messages/unread');
      set({ unreadCount: data.unreadCount });
    } catch (error) {
      console.error(error);
    }
  },
}));

export default useMessageStore;
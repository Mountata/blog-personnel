import { create } from 'zustand';
import API from '../utils/axios';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user')) || null,
  loading: false,
  error: null,

  // Inscription
  register: async (formData) => {
  set({ loading: true, error: null });
  try {
    const { data } = await API.post('/auth/register', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    localStorage.setItem('user', JSON.stringify(data));
    set({ user: data, loading: false });
    return { success: true };
  } catch (error) {
    set({ error: error.response?.data?.message, loading: false });
    return { success: false, message: error.response?.data?.message };
  }
},


  

  // Connexion
  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const { data } = await API.post('/auth/login', credentials);
      localStorage.setItem('user', JSON.stringify(data));
      set({ user: data, loading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.response?.data?.message, loading: false });
      return { success: false, message: error.response?.data?.message };
    }
  },

  // Déconnexion
  logout: async () => {
    try {
      await API.post('/auth/logout');
    } catch (error) {
      console.error(error);
    }
    localStorage.removeItem('user');
    set({ user: null });
  },

  // Mettre à jour user local
  updateUser: (updatedUser) => {
    const current = JSON.parse(localStorage.getItem('user'));
    const newUser  = { ...current, ...updatedUser };
    localStorage.setItem('user', JSON.stringify(newUser));
    set({ user: newUser });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
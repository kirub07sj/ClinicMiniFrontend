import { create } from 'zustand';
import { User } from '../types';
import authService from '../services/auth.service';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: true,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const response = await authService.login(credentials);
      localStorage.setItem('token', response.token);
      set({ user: response.user, token: response.token, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const profile = await authService.getProfile();
        set({ user: profile, token, loading: false });
      } catch {
        localStorage.removeItem('token');
        set({ user: null, token: null, loading: false });
      }
    } else {
      set({ loading: false });
    }
  }
}));

export default useAuthStore;

import api from './api';
import { AuthResponse, User } from '../types';

/**
 * Auth API service — login and profile only (no public registration)
 */
export const authService = {
  login: async (credentials: { email: string; password: string }): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  },

  updateProfile: async (data: Partial<User> & { password?: string }): Promise<{ user: User }> => {
    const response = await api.put<{ user: User }>('/auth/profile', data);
    return response.data;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password-request', { email });
    return response.data;
  },

  confirmPasswordReset: async (notificationId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/reset-password-confirm', { notificationId });
    return response.data;
  },

  adminResetPassword: async (userId: string): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>('/auth/admin-reset-password', { userId });
    return response.data;
  }
};

export default authService;

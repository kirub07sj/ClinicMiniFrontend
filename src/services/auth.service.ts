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
  }
};

export default authService;

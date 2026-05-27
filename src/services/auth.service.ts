import api from './api';
import { AuthResponse, User } from '../types';

/**
 * Service to execute Auth-related API requests
 */
export const authService = {
  /**
   * Log in user credentials and fetch token/profile
   */
  login: async (credentials: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  /**
   * Register a new user account
   */
  register: async (userData: any): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  /**
   * Retrieve currently logged-in user profile
   */
  getProfile: async (): Promise<User> => {
    const response = await api.get<User>('/auth/me');
    return response.data;
  }
};

export default authService;

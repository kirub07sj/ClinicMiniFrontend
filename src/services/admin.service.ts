import api from './api';
import { User, DashboardStats } from '../types';

export const adminService = {
  registerStaff: async (staffData: any): Promise<{ user: User }> => {
    const response = await api.post<{ user: User }>('/admin/staff', staffData);
    return response.data;
  },

  updateStaff: async (id: string, staffData: any): Promise<{ user: User }> => {
    const response = await api.put<{ user: User }>(`/admin/staff/${id}`, staffData);
    return response.data;
  },

  getAllStaff: async (): Promise<User[]> => {
    const response = await api.get<User[]>('/admin/staff');
    return response.data;
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>('/admin/stats');
    return response.data;
  }
};

export default adminService;

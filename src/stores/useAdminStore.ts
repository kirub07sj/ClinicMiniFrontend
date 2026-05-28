import { create } from 'zustand';
import { User, DashboardStats } from '../types';
import adminService from '../services/admin.service';

interface AdminState {
  staff: User[];
  stats: DashboardStats | null;
  loading: boolean;
  fetchStaff: () => Promise<void>;
  fetchStats: () => Promise<void>;
  registerStaff: (data: any) => Promise<void>;
  updateStaff: (id: string, data: any) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  staff: [],
  stats: null,
  loading: false,

  fetchStaff: async () => {
    set({ loading: true });
    try {
      const staff = await adminService.getAllStaff();
      set({ staff, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await adminService.getDashboardStats();
      set({ stats });
    } catch {
      // silently fail
    }
  },

  registerStaff: async (data: any) => {
    const result = await adminService.registerStaff(data);
    set((state) => ({
      staff: [result.user, ...state.staff]
    }));
  },

  updateStaff: async (id: string, data: any) => {
    const result = await adminService.updateStaff(id, data);
    set((state) => ({
      staff: state.staff.map(user => user._id === id || user.id === id ? { ...user, ...result.user } : user)
    }));
  }
}));

export default useAdminStore;

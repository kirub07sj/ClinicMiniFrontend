import { create } from 'zustand';
import { Notification } from '../types';
import notificationService from '../services/notification.service';
import { useAppointmentStore } from './useAppointmentStore';
import usePatientStore from './usePatientStore';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  loading: false,

  fetchNotifications: async () => {
    set({ loading: true });
    try {
      const notifications = await notificationService.getNotifications();
      set({ notifications, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const prevCount = get().unreadCount;
      const count = await notificationService.getUnreadCount();
      set({ unreadCount: count });

      // If new notifications arrived, refresh table data
      if (count > prevCount) {
        useAppointmentStore.getState().fetchAppointments();
        useAppointmentStore.getState().fetchDoctorsWithCounts();
        usePatientStore.getState().fetchPatients();
      }
    } catch {
      // silently fail
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch {
      // silently fail
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch {
      // silently fail
    }
  },
}));

export default useNotificationStore;

import api from './api';
import { Appointment } from '../types';

/**
 * Service to execute Appointment-related API requests
 */
export const appointmentService = {
  /**
   * Fetch all appointments matching filters
   */
  getAppointments: async (params?: any): Promise<Appointment[]> => {
    const response = await api.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  /**
   * Fetch a single appointment details by ID
   */
  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  /**
   * Book a new appointment
   */
  createAppointment: async (appointmentData: any): Promise<Appointment> => {
    const response = await api.post<Appointment>('/appointments', appointmentData);
    return response.data;
  },

  /**
   * Update status/notes for an appointment
   */
  updateAppointment: async (id: string, updateData: any): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}`, updateData);
    return response.data;
  }
};

export default appointmentService;

import api from './api';
import { Appointment, DoctorWithCount } from '../types';

export const appointmentService = {
  getAppointments: async (params?: any): Promise<Appointment[]> => {
    const response = await api.get<Appointment[]>('/appointments', { params });
    return response.data;
  },

  getAppointmentById: async (id: string): Promise<Appointment> => {
    const response = await api.get<Appointment>(`/appointments/${id}`);
    return response.data;
  },

  createAppointment: async (data: any): Promise<Appointment> => {
    const response = await api.post<Appointment>('/appointments', data);
    return response.data;
  },

  updateAppointment: async (id: string, data: any): Promise<Appointment> => {
    const response = await api.put<Appointment>(`/appointments/${id}`, data);
    return response.data;
  },

  getDoctorsWithCounts: async (): Promise<DoctorWithCount[]> => {
    const response = await api.get<DoctorWithCount[]>('/appointments/doctors');
    return response.data;
  }
};

export default appointmentService;

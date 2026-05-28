import { create } from 'zustand';
import { Appointment, DoctorWithCount } from '../types';
import appointmentService from '../services/appointment.service';

interface AppointmentState {
  appointments: Appointment[];
  doctorsWithCounts: DoctorWithCount[];
  loading: boolean;
  fetchAppointments: (params?: any) => Promise<void>;
  fetchDoctorsWithCounts: () => Promise<void>;
  createAppointment: (data: any) => Promise<Appointment>;
  updateAppointment: (id: string, data: any) => Promise<void>;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  doctorsWithCounts: [],
  loading: false,

  fetchAppointments: async (params?: any) => {
    set({ loading: true });
    try {
      const appointments = await appointmentService.getAppointments(params);
      set({ appointments, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  fetchDoctorsWithCounts: async () => {
    try {
      const doctors = await appointmentService.getDoctorsWithCounts();
      set({ doctorsWithCounts: doctors });
    } catch {
      // silently fail
    }
  },

  createAppointment: async (data: any) => {
    const appointment = await appointmentService.createAppointment(data);
    set((state) => ({
      appointments: [appointment, ...state.appointments]
    }));
    // Refresh doctor counts since a new appointment was added
    get().fetchDoctorsWithCounts();
    return appointment;
  },

  updateAppointment: async (id: string, data: any) => {
    const updated = await appointmentService.updateAppointment(id, data);
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a._id === id ? updated : a
      )
    }));
    get().fetchDoctorsWithCounts();
  }
}));

export default useAppointmentStore;

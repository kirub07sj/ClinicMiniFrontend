import { create } from 'zustand';
import { Patient } from '../types';
import patientService from '../services/patient.service';

interface PatientState {
  patients: Patient[];
  searchResults: Patient[];
  loading: boolean;
  fetchPatients: () => Promise<void>;
  searchPatients: (query: string) => Promise<void>;
  createPatient: (data: any) => Promise<Patient>;
}

export const usePatientStore = create<PatientState>((set, get) => ({
  patients: [],
  searchResults: [],
  loading: false,

  fetchPatients: async () => {
    set({ loading: true });
    try {
      const patients = await patientService.getAllPatients();
      set({ patients, searchResults: patients, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  searchPatients: async (query: string) => {
    if (!query.trim()) {
      set({ searchResults: get().patients });
      return;
    }
    set({ loading: true });
    try {
      const results = await patientService.searchPatients(query);
      set({ searchResults: results, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createPatient: async (data: any) => {
    const patient = await patientService.createPatient(data);
    set((state) => ({
      patients: [patient, ...state.patients],
      searchResults: [patient, ...state.searchResults]
    }));
    return patient;
  }
}));

export default usePatientStore;

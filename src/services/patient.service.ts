import api from './api';
import { Patient } from '../types';

export const patientService = {
  createPatient: async (data: any): Promise<Patient> => {
    const response = await api.post<Patient>('/patients', data);
    return response.data;
  },

  getAllPatients: async (): Promise<Patient[]> => {
    const response = await api.get<Patient[]>('/patients');
    return response.data;
  },

  searchPatients: async (query: string): Promise<Patient[]> => {
    const response = await api.get<Patient[]>('/patients/search', { params: { q: query } });
    return response.data;
  },

  getPatientById: async (id: string): Promise<Patient> => {
    const response = await api.get<Patient>(`/patients/${id}`);
    return response.data;
  },

  updatePatient: async (id: string, data: any): Promise<Patient> => {
    const response = await api.put<Patient>(`/patients/${id}`, data);
    return response.data;
  }
};

export default patientService;

export interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  role: 'admin' | 'doctor' | 'receptionist';
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicalInfo {
  diagnosisTags?: string[];
  treatmentTags?: string[];
  prescription?: string;
  additionalInfo?: string;
}

export interface Patient {
  _id: string;
  patientId: string; // Custom short ID (PAT-00001)
  name: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other';
  address?: string;
  medicalInfo?: MedicalInfo;
  createdAt?: string;
  updatedAt?: string;
}

export interface DoctorWithCount extends User {
  activePatientCount: number;
}

export interface Appointment {
  _id: string;
  patientId: Patient;
  doctorId: User;
  createdBy: User;
  appointmentDate: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  reason: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface DashboardStats {
  totalDoctors: number;
  totalReceptionists: number;
  totalPatients: number;
  totalAppointments: number;
}

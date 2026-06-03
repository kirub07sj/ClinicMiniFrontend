import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import usePatientStore from '../../stores/usePatientStore';
import useAppointmentStore from '../../stores/useAppointmentStore';
import AppointmentModal from '../../components/AppointmentModal';
import PatientRegistrationModal, { RegistrationPayload } from '../../components/PatientRegistrationModal';
import DoctorFolderCard from '../../components/DoctorFolderCard';
import { usePortalSearch } from '../../layouts/PortalLayout';
import { formatDate } from '../../utils/format';
import { CalendarPlus, UserPlus, Loader2 } from 'lucide-react';
import { Patient, DoctorWithCount, Appointment } from '../../types';
import { cn } from '../../utils/cn';

type Tab = 'dashboard' | 'patients';

const statusPill = (status: string) => {
  switch (status) {
    case 'confirmed':
      return { label: 'in treatment', className: 'bg-blue-600 text-white' };
    case 'completed':
      return { label: 'done', className: 'bg-emerald-500 text-white' };
    case 'cancelled':
      return { label: 'cancelled', className: 'bg-rose-500 text-white' };
    default:
      return { label: 'waiting', className: 'bg-sky-500 text-white' };
  }
};

export const ReceptionistDashboard: React.FC = () => {
  const { patients, searchResults, fetchPatients, searchPatients, createPatient, loading: patientsLoading } =
    usePatientStore();
  const {
    appointments,
    doctorsWithCounts,
    fetchAppointments,
    fetchDoctorsWithCounts,
    createAppointment,
    loading: appointmentsLoading,
  } = useAppointmentStore();

  const { searchQuery } = usePortalSearch();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [modalPatientSearch, setModalPatientSearch] = useState<typeof searchResults>([]);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchDoctorsWithCounts();
  }, []);

  // Navbar search drives the patients table
  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleModalPatientSearch = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setModalPatientSearch([]);
        return;
      }
      const q = query.toLowerCase();
      setModalPatientSearch(
        patients.filter(
          (p: Patient) =>
            p.name.toLowerCase().includes(q) || p.phone.includes(q) || p.patientId.toLowerCase().includes(q)
        )
      );
    },
    [patients]
  );

  const handleCreateAppointment = async (appointmentData: any, patientData?: any) => {
    let finalPatientId = appointmentData.patientId;
    if (patientData) {
      const newPatient = await createPatient(patientData);
      finalPatientId = newPatient._id;
    }
    await createAppointment({ ...appointmentData, patientId: finalPatientId });
    fetchAppointments();
  };

  // Register patient + assign doctor (creates a pending appointment so the count reflects the assignment)
  const handleRegister = async (payload: RegistrationPayload) => {
    const newPatient = await createPatient(payload.patient);
    await createAppointment({
      patientId: newPatient._id,
      doctorId: payload.doctorId,
      appointmentDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      reason: 'Initial consultation',
      notes: payload.additionalInfo,
    });
    fetchAppointments();
  };

  // Navbar search also filters the Recent Patients (appointments) table
  const filteredAppointments = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (a: Appointment) =>
        a.patientId?.name?.toLowerCase().includes(q) ||
        a.patientId?.patientId?.toLowerCase().includes(q) ||
        a.patientId?.phone?.includes(q) ||
        a.doctorId?.name?.toLowerCase().includes(q)
    );
  }, [appointments, searchQuery]);

  const TabButton: React.FC<{ id: Tab; label: string }> = ({ id, label }) => (
    <button
      type="button"
      onClick={() => setTab(id)}
      className={cn(
        'px-5 py-2 rounded-lg text-sm font-bold transition-colors',
        tab === id ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'
      )}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 sm:p-8">
      {/* Tabs + actions */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-7">
        <div className="flex items-center gap-2">
          <TabButton id="dashboard" label="Dashboard" />
          <TabButton id="patients" label="Patients" />
        </div>
        <button
          type="button"
          onClick={() => setShowRegisterModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Register New Patient
        </button>
      </div>

      {tab === 'dashboard' ? (
        <div className="space-y-8">
          {/* Available Doctors */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Available Doctors</h3>
            {doctorsWithCounts.length === 0 ? (
              <p className="text-slate-400 text-sm">No doctors registered yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {doctorsWithCounts.map((doc: DoctorWithCount, i: number) => (
                  <motion.div
                    key={doc._id || doc.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                  >
                    <DoctorFolderCard doctor={doc} active={i === 0} />
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Recent Patients */}
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Recent Patients</h3>
            {appointmentsLoading ? (
              <div className="flex flex-col items-center justify-center py-14 text-slate-400">
                <Loader2 className="w-7 h-7 animate-spin mb-2 text-sky-600" />
                <p className="text-sm font-medium">Loading...</p>
              </div>
            ) : filteredAppointments.length === 0 ? (
              <p className="text-slate-400 text-center py-14 font-medium">No recent patients.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-left">
                      <th className="px-4 py-3 font-medium">Full Name</th>
                      <th className="px-4 py-3 font-medium">Assigned Doctor</th>
                      <th className="px-4 py-3 font-medium">Patient ID</th>
                      <th className="px-4 py-3 font-medium">Date &amp; Time</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.slice(0, 25).map((a: Appointment) => {
                      const pill = statusPill(a.status);
                      return (
                        <tr key={a._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-4 font-bold text-slate-800">{a.patientId?.name}</td>
                          <td className="px-4 py-4 text-slate-600 font-medium">Dr. {a.doctorId?.name}</td>
                          <td className="px-4 py-4 font-bold text-slate-800">{a.patientId?.patientId}</td>
                          <td className="px-4 py-4 text-slate-500">{formatDate(a.appointmentDate)}</td>
                          <td className="px-4 py-4">
                            <span className={cn('px-4 py-1.5 rounded-full text-xs font-semibold', pill.className)}>
                              {pill.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      ) : (
        /* Patients tab */
        <div className="space-y-5">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-lg font-bold text-slate-800">All Patients</h3>
            <button
              type="button"
              onClick={() => setShowAppointmentModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-colors"
            >
              <CalendarPlus className="w-4 h-4" />
              New Appointment
            </button>
          </div>

          {patientsLoading ? (
            <div className="flex flex-col items-center justify-center py-14 text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin mb-2 text-sky-600" />
              <p className="text-sm font-medium">Loading patients...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <p className="text-slate-400 text-center py-14 font-medium">
              {searchQuery ? 'No patients match your search.' : 'No patients registered yet.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="px-4 py-3 font-medium">Patient ID</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Gender</th>
                    <th className="px-4 py-3 font-medium">Date of Birth</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((p: Patient) => (
                    <tr key={p._id} className="border-t border-slate-100 hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-4 font-bold text-slate-800">{p.patientId}</td>
                      <td className="px-4 py-4 font-bold text-slate-800">{p.name}</td>
                      <td className="px-4 py-4 text-slate-600">{p.phone}</td>
                      <td className="px-4 py-4 text-slate-600 capitalize">{p.gender}</td>
                      <td className="px-4 py-4 text-slate-600">{new Date(p.dateOfBirth).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-slate-500">{p.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <PatientRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        doctors={doctorsWithCounts}
        onSubmit={handleRegister}
      />
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSubmit={handleCreateAppointment}
        patients={modalPatientSearch}
        doctors={doctorsWithCounts}
        onSearchPatient={handleModalPatientSearch}
      />
    </div>
  );
};

export default ReceptionistDashboard;

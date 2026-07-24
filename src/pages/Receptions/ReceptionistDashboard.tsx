import React, { useEffect, useState, useMemo } from 'react';
import usePatientStore from '../../stores/usePatientStore';
import useAppointmentStore from '../../stores/useAppointmentStore';
import PatientRegistrationModal, { RegistrationPayload } from '../../components/PatientRegistrationModal';
import PatientDetailPage from '../PatientDetailPage';
import DoctorCarousel from '../../components/DoctorCarousel';
import { usePortalSearch } from '../../layouts/PortalLayout';
import { formatDate } from '../../utils/format';
import { UserPlus, Loader2 } from 'lucide-react';
import { Patient, Appointment } from '../../types';
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
  const { searchResults, fetchPatients, searchPatients, createPatient, updatePatient, loading: patientsLoading } =
    usePatientStore();
  const {
    appointments,
    doctorsWithCounts,
    fetchAppointments,
    fetchDoctorsWithCounts,
    createAppointment,
    loading: appointmentsLoading,
    doctorsLoading,
  } = useAppointmentStore();

  const { searchQuery } = usePortalSearch();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  useEffect(() => {
    fetchPatients();
    fetchAppointments();
    fetchDoctorsWithCounts();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchPatients(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Register patient + assign doctor (creates appointment so count reflects assignment)
  const handleRegister = async (payload: RegistrationPayload) => {
    let patientId = payload.patientId;
    if (!payload.isExistingPatient && payload.patient) {
      const newPatient = await createPatient(payload.patient);
      patientId = newPatient._id;
    }
    
    if (!patientId) {
      throw new Error("Patient selection is required");
    }

    await createAppointment({
      patientId,
      doctorId: payload.doctorId,
      appointmentDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      reason: payload.isExistingPatient ? 'Follow-up consultation' : 'Initial consultation',
      notes: payload.additionalInfo,
    });
    fetchAppointments();
  };

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

  // Full-page patient detail
  if (selectedPatient) {
    return (
      <PatientDetailPage
        patient={selectedPatient}
        role="receptionist"
        onBack={() => setSelectedPatient(null)}
        onUpdate={async (id, data) => {
          await updatePatient(id, data);
          fetchPatients();
        }}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm h-full overflow-hidden flex flex-col">
      {/* Tabs + actions — fixed at top */}
      <div className="flex items-center justify-between flex-wrap gap-3 px-6 sm:px-8 pt-6 sm:pt-8 pb-4 shrink-0">
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

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 sm:px-8 pb-6 sm:pb-8">
        {tab === 'dashboard' ? (
          <div className="space-y-8">
            {/* Available Doctors */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Available Doctors</h3>
              {doctorsLoading ? (
                <div className="flex items-center gap-5 overflow-x-auto scrollbar-hide py-1">
                  <div className="w-[280px] h-[140px] bg-slate-100 animate-pulse rounded-2xl shrink-0 border border-slate-200" />
                  <div className="w-[200px] h-[140px] bg-slate-100 animate-pulse rounded-2xl shrink-0 border border-slate-200" />
                  <div className="w-[200px] h-[140px] bg-slate-100 animate-pulse rounded-2xl shrink-0 border border-slate-200" />
                  <div className="w-[200px] h-[140px] bg-slate-100 animate-pulse rounded-2xl shrink-0 border border-slate-200" />
                </div>
              ) : doctorsWithCounts.length === 0 ? (
                <p className="text-slate-400 text-sm">No doctors registered yet.</p>
              ) : (
                <DoctorCarousel doctors={doctorsWithCounts} />
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
                          <tr
                            key={a._id}
                            className="border-t border-slate-100 hover:bg-sky-50/40 transition-colors cursor-pointer"
                            onClick={() => a.patientId && setSelectedPatient(a.patientId as Patient)}
                          >
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
            <h3 className="text-lg font-bold text-slate-800">All Patients</h3>
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
                      <tr
                        key={p._id}
                        className="border-t border-slate-100 hover:bg-sky-50/40 transition-colors cursor-pointer"
                        onClick={() => setSelectedPatient(p)}
                      >
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
      </div>

      {/* Modals */}
      <PatientRegistrationModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        doctors={doctorsWithCounts}
        patients={searchResults}
        appointments={appointments}
        onSubmit={handleRegister}
      />

    </div>
  );
};

export default ReceptionistDashboard;

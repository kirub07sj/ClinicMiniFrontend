import React, { useEffect, useMemo, useState, useCallback } from 'react';
import useAppointmentStore from '../../stores/useAppointmentStore';
import usePatientStore from '../../stores/usePatientStore';
import useAuthStore from '../../stores/useAuthStore';
import AppointmentModal from '../../components/AppointmentModal';
import PatientDetailPage from '../PatientDetailPage';
import { usePortalSearch } from '../../layouts/PortalLayout';
import { formatDate } from '../../utils/format';
import { X, FileText, CheckCircle, Loader2, CalendarPlus, ChevronRight } from 'lucide-react';
import { Appointment, Patient } from '../../types';
import { cn } from '../../utils/cn';

type Tab = 'dashboard' | 'patients' | 'appointment';

const isToday = (dateString: string): boolean => {
  const d = new Date(dateString);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

const statusPill = (status: string) => {
  switch (status) {
    case 'confirmed':
      return { label: 'In Treatment', className: 'bg-blue-600 text-white' };
    case 'completed':
      return { label: 'Done', className: 'bg-emerald-500 text-white' };
    case 'cancelled':
      return { label: 'Cancelled', className: 'bg-rose-500 text-white' };
    default:
      return { label: 'waiting', className: 'bg-sky-500 text-white' };
  }
};

export const DoctorDashboard: React.FC = () => {
  const { appointments, loading, fetchAppointments, updateAppointment, createAppointment } =
    useAppointmentStore();
  const { patients, fetchPatients, updatePatient } = usePatientStore();
  const { user } = useAuthStore();
  const { searchQuery } = usePortalSearch();

  const doctorId = user?._id || user?.id || '';

  const [tab, setTab] = useState<Tab>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [error, setError] = useState('');

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Appointment modal state
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [modalPatientSearch, setModalPatientSearch] = useState<Patient[]>([]);

  useEffect(() => {
    fetchAppointments();
    fetchPatients();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(
      (a: Appointment) =>
        a.patientId?.name?.toLowerCase().includes(q) ||
        a.patientId?.phone?.includes(q) ||
        a.patientId?.patientId?.toLowerCase().includes(q)
    );
  }, [appointments, searchQuery]);

  const todaysList = useMemo(() => filtered.filter((a) => isToday(a.appointmentDate)), [filtered]);

  // Upcoming appointments only — exclude already-treated (completed) and
  // cancelled ones, and anything before today.
  const upcomingList = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return filtered.filter(
      (a) =>
        (a.status === 'pending' || a.status === 'confirmed') &&
        new Date(a.appointmentDate).getTime() >= startOfToday.getTime()
    );
  }, [filtered]);

  const uniquePatients = useMemo(() => {
    const map = new Map<string, Patient>();
    filtered.forEach((a) => {
      if (a.patientId?._id) map.set(a.patientId._id, a.patientId);
    });
    return Array.from(map.values());
  }, [filtered]);

  // Appointments only populate a subset of patient fields (no medicalInfo),
  // so resolve the full record from the patients store before opening details.
  const openPatientDetails = useCallback(
    (p?: Patient | null) => {
      if (!p) return;
      const full = patients.find((pt: Patient) => pt._id === p._id) || p;
      setSelectedPatient(full);
    },
    [patients]
  );

  const handleStatusChange = async (id: string, status: string) => {
    setError('');
    try {
      await updateAppointment(id, { status });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleSaveNotes = async (id: string) => {
    setError('');
    try {
      await updateAppointment(id, { notes: doctorNotes });
      setEditingId(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save notes');
    }
  };

  // Patient search for the appointment modal
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

  // Doctor creates appointment for themselves
  const handleCreateAppointment = async (appointmentData: any, patientData?: any) => {
    let finalPatientId = appointmentData.patientId;
    if (patientData) {
      const newPatient = await usePatientStore.getState().createPatient(patientData);
      finalPatientId = newPatient._id;
    }
    await createAppointment({ ...appointmentData, patientId: finalPatientId, doctorId });
    fetchAppointments();
  };

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
        role="doctor"
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
          <TabButton id="appointment" label="Appointment" />
        </div>
        <button
          type="button"
          onClick={() => setShowAppointmentModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-sm shadow-md transition-colors"
        >
          <CalendarPlus className="w-4 h-4" />
          New Appointment
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 sm:px-8 pb-6 sm:pb-8">
        {error && (
          <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm">{error}</div>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-600" />
            <p className="text-sm font-medium">Loading appointments...</p>
          </div>
        ) : tab === 'dashboard' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Today's Patients List */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Today's Patients List</h3>
              {todaysList.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">No patients scheduled for today.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-left">
                      <th className="px-3 py-3 font-medium">Full Name</th>
                      <th className="px-3 py-3 font-medium">Patient ID</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todaysList.map((a) => {
                      const pill = statusPill(a.status);
                      return (
                        <tr key={a._id} className="border-t border-slate-100 hover:bg-sky-50/40 transition-colors cursor-pointer" onClick={() => openPatientDetails(a.patientId as Patient)}>
                          <td className="px-3 py-4 font-bold text-slate-800">{a.patientId?.name}</td>
                          <td className="px-3 py-4 font-bold text-slate-800">{a.patientId?.patientId}</td>
                          <td className="px-3 py-4">
                            <span className={cn('px-4 py-1.5 rounded-full text-xs font-semibold', pill.className)}>
                              {pill.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </section>

            {/* Appointed Patients List */}
            <section>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Appointed Patients List</h3>
              {upcomingList.length === 0 ? (
                <p className="text-slate-400 text-sm py-8 text-center">No upcoming appointments.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 text-left">
                      <th className="px-3 py-3 font-medium">Full Name</th>
                      <th className="px-3 py-3 font-medium">Patient ID</th>
                      <th className="px-3 py-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {upcomingList.slice(0, 25).map((a) => (
                      <tr key={a._id} className="border-t border-slate-100">
                        <td className="px-3 py-4 font-bold text-slate-800">{a.patientId?.name}</td>
                        <td className="px-3 py-4 font-bold text-slate-800">{a.patientId?.patientId}</td>
                        <td className="px-3 py-4 text-slate-500">{formatDate(a.appointmentDate)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </section>
          </div>
        ) : tab === 'patients' ? (
          /* Patients tab */
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4">My Patients</h3>
            {uniquePatients.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">No patients yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="px-3 py-3 font-medium">Full Name</th>
                    <th className="px-3 py-3 font-medium">Patient ID</th>
                    <th className="px-3 py-3 font-medium">Phone</th>
                    <th className="px-3 py-3 font-medium">Gender</th>
                  </tr>
                </thead>
                <tbody>
                  {uniquePatients.map((p) => (
                    <tr key={p._id} className="border-t border-slate-100 hover:bg-sky-50/40 transition-colors cursor-pointer" onClick={() => openPatientDetails(p)}>
                      <td className="px-3 py-4 font-bold text-slate-800">{p.name}</td>
                      <td className="px-3 py-4 font-bold text-slate-800">{p.patientId}</td>
                      <td className="px-3 py-4 text-slate-600">{p.phone}</td>
                      <td className="px-3 py-4 text-slate-600 capitalize">{p.gender}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        ) : (
          /* Appointment management tab */
          <section>
            <h3 className="text-lg font-bold text-slate-800 mb-4">Manage Appointments</h3>
            {filtered.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">No appointments assigned to you.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left">
                    <th className="px-3 py-3 font-medium">Full Name</th>
                    <th className="px-3 py-3 font-medium">Patient ID</th>
                    <th className="px-3 py-3 font-medium">Date</th>
                    <th className="px-3 py-3 font-medium">Reason</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a: Appointment) => {
                    const pill = statusPill(a.status);
                    return (
                      <React.Fragment key={a._id}>
                        <tr
                          className="border-t border-slate-100 hover:bg-sky-50/40 transition-colors cursor-pointer"
                          onClick={() => openPatientDetails(a.patientId as Patient)}
                        >
                          <td className="px-3 py-4 font-bold text-slate-800">{a.patientId?.name}</td>
                          <td className="px-3 py-4 font-mono font-semibold text-slate-600">{a.patientId?.patientId}</td>
                          <td className="px-3 py-4 text-slate-500">{formatDate(a.appointmentDate)}</td>
                          <td className="px-3 py-4 text-slate-600 max-w-[14rem] truncate">{a.reason}</td>
                          <td className="px-3 py-4">
                            <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', pill.className)}>
                              {pill.label}
                            </span>
                          </td>
                          <td className="px-3 py-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-2 justify-end">
                              {a.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleStatusChange(a._id, 'confirmed')}
                                    className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg border border-sky-100 transition-colors"
                                    title="Start Treatment"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(a._id, 'cancelled')}
                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-100 transition-colors"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </>
                              )}

                              {a.status === 'confirmed' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingId(editingId === a._id ? null : a._id);
                                      setDoctorNotes(a.notes || '');
                                    }}
                                    className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5"
                                    title="Add Notes"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span>Notes</span>
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(a._id, 'completed')}
                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-colors text-xs font-semibold flex items-center gap-1.5"
                                    title="Complete"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Complete</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>

                        {(a.notes || editingId === a._id) && (
                          <tr className="border-t border-slate-50 bg-slate-50/40">
                            <td colSpan={6} className="px-3 pb-4 pt-0">
                              {a.notes && editingId !== a._id && (
                                <div className="p-3 bg-white rounded-lg text-xs text-slate-600 border border-slate-100">
                                  <strong className="text-slate-700 block mb-1">Clinical Notes:</strong>
                                  {a.notes}
                                </div>
                              )}
                              {editingId === a._id && (
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={doctorNotes}
                                    onChange={(e) => setDoctorNotes(e.target.value)}
                                    placeholder="Add prescription, findings..."
                                    className="flex-1 text-xs border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-sky-500"
                                  />
                                  <button
                                    onClick={() => handleSaveNotes(a._id)}
                                    className="bg-sky-600 hover:bg-sky-700 text-white rounded px-3 text-xs font-semibold transition-colors"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-3 text-xs font-semibold transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        onSubmit={handleCreateAppointment}
        patients={modalPatientSearch}
        doctors={[]}
        onSearchPatient={handleModalPatientSearch}
        defaultDoctorId={doctorId}
      />

    </div>
  );
};

export default DoctorDashboard;

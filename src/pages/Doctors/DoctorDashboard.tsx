import React, { useEffect, useMemo, useState } from 'react';
import useAppointmentStore from '../../stores/useAppointmentStore';
import { usePortalSearch } from '../../layouts/PortalLayout';
import { formatDate } from '../../utils/format';
import { Check, X, FileText, CheckCircle, Loader2 } from 'lucide-react';
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
  const { appointments, loading, fetchAppointments, updateAppointment } = useAppointmentStore();
  const { searchQuery } = usePortalSearch();

  const [tab, setTab] = useState<Tab>('dashboard');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
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

  const todaysList = useMemo(
    () => filtered.filter((a) => isToday(a.appointmentDate)),
    [filtered]
  );

  // Unique patients seen by this doctor
  const uniquePatients = useMemo(() => {
    const map = new Map<string, Patient>();
    filtered.forEach((a) => {
      if (a.patientId?._id) map.set(a.patientId._id, a.patientId);
    });
    return Array.from(map.values());
  }, [filtered]);

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
      {/* Tabs */}
      <div className="flex items-center gap-2 mb-7 flex-wrap">
        <TabButton id="dashboard" label="Dashboard" />
        <TabButton id="patients" label="Patients" />
        <TabButton id="appointment" label="Appointment" />
      </div>

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
                      <tr key={a._id} className="border-t border-slate-100">
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
            {filtered.length === 0 ? (
              <p className="text-slate-400 text-sm py-8 text-center">No appointments assigned to you.</p>
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
                  {filtered.slice(0, 25).map((a) => (
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
                  <tr key={p._id} className="border-t border-slate-100">
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
        /* Appointment management tab — preserves existing workflow */
        <section>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Manage Appointments</h3>
          {filtered.length === 0 ? (
            <p className="text-slate-400 text-sm py-8 text-center">No appointments assigned to you.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((a: Appointment) => {
                const pill = statusPill(a.status);
                return (
                  <div key={a._id} className="py-5 hover:bg-slate-50/50 transition-colors rounded-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h4 className="font-bold text-slate-800">{a.patientId?.name}</h4>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono font-semibold">
                            {a.patientId?.patientId}
                          </span>
                          <span className={cn('px-3 py-1 rounded-full text-xs font-semibold', pill.className)}>
                            {pill.label}
                          </span>
                        </div>
                        <p className="text-slate-500 text-sm">{formatDate(a.appointmentDate)}</p>
                        <p className="text-slate-500 text-sm">
                          <span className="text-slate-400">Phone:</span> {a.patientId?.phone}
                        </p>
                        <p className="text-slate-700 text-sm">
                          <span className="text-slate-400">Reason:</span> {a.reason}
                        </p>

                        {a.notes && (
                          <div className="mt-2 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
                            <strong className="text-slate-700 block mb-1">Clinical Notes:</strong>
                            {a.notes}
                          </div>
                        )}

                        {editingId === a._id && (
                          <div className="mt-3 flex gap-2">
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
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        {a.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(a._id, 'confirmed')}
                              className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg border border-sky-100 transition-colors"
                              title="Confirm"
                            >
                              <Check className="w-4 h-4" />
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
                                setEditingId(a._id);
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
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default DoctorDashboard;

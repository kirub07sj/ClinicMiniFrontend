import React, { useEffect, useState } from 'react';
import useAppointmentStore from '../../stores/useAppointmentStore';
import SearchBar from '../../components/SearchBar';
import { formatDate } from '../../utils/format';
import { Check, X, FileText, CheckCircle } from 'lucide-react';
import { Appointment } from '../../types';

export const DoctorDashboard: React.FC = () => {
  const { appointments, loading, fetchAppointments, updateAppointment } = useAppointmentStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Filter appointments by search (patient name, phone, or ID)
  const filtered = appointments.filter((a: Appointment) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.patientId?.name?.toLowerCase().includes(q) ||
      a.patientId?.phone?.includes(q) ||
      a.patientId?.patientId?.toLowerCase().includes(q)
    );
  });

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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">My Appointments</h2>
          <p className="text-slate-500 text-sm">View and manage your appointed patients</p>
        </div>
        <div className="w-full md:w-80">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-sm">{error}</div>
      )}

      {/* Appointments */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <p className="text-slate-400 text-center py-8">Loading appointments...</p>
        ) : filtered.length === 0 ? (
          <p className="text-slate-400 text-center py-8">
            {searchQuery ? 'No patients match your search.' : 'No appointments assigned to you.'}
          </p>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((a: Appointment) => (
              <div key={a._id} className="p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Patient Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h4 className="font-bold text-slate-800">{a.patientId?.name}</h4>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-mono font-semibold">
                        {a.patientId?.patientId}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                        a.status === 'confirmed' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                        a.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                        a.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                        'bg-yellow-50 text-yellow-700 border border-yellow-100'
                      }`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-slate-500 text-sm">{formatDate(a.appointmentDate)}</p>
                    <p className="text-slate-500 text-sm"><span className="text-slate-400">Phone:</span> {a.patientId?.phone}</p>
                    <p className="text-slate-700 text-sm"><span className="text-slate-400">Reason:</span> {a.reason}</p>

                    {/* Clinical Notes */}
                    {a.notes && (
                      <div className="mt-2 p-3 bg-slate-100 rounded-lg text-xs text-slate-600">
                        <strong className="text-slate-700 block mb-1">Clinical Notes:</strong>
                        {a.notes}
                      </div>
                    )}

                    {/* Notes Editing */}
                    {editingId === a._id && (
                      <div className="mt-3 flex gap-2">
                        <input type="text" value={doctorNotes}
                          onChange={(e) => setDoctorNotes(e.target.value)}
                          placeholder="Add prescription, findings..."
                          className="flex-1 text-xs border border-slate-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-sky-500" />
                        <button onClick={() => handleSaveNotes(a._id)}
                          className="bg-sky-600 hover:bg-sky-700 text-white rounded px-3 text-xs font-semibold transition-colors">Save</button>
                        <button onClick={() => setEditingId(null)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-3 text-xs font-semibold transition-colors">Cancel</button>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-shrink-0">
                    {a.status === 'pending' && (
                      <>
                        <button onClick={() => handleStatusChange(a._id, 'confirmed')}
                          className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg border border-sky-100 transition-colors"
                          title="Confirm">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleStatusChange(a._id, 'cancelled')}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-100 transition-colors"
                          title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {a.status === 'confirmed' && (
                      <>
                        <button onClick={() => { setEditingId(a._id); setDoctorNotes(a.notes || ''); }}
                          className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5"
                          title="Add Notes">
                          <FileText className="w-4 h-4" />
                          <span>Notes</span>
                        </button>
                        <button onClick={() => handleStatusChange(a._id, 'completed')}
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-colors text-xs font-semibold flex items-center gap-1.5"
                          title="Complete">
                          <CheckCircle className="w-4 h-4" />
                          <span>Complete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import appointmentService from '../services/appointment.service';
import { Appointment } from '../types';
import { formatDate } from '../utils/format';
import { Calendar, FileText, Check, X, AlertCircle } from 'lucide-react';

export const Appointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states for booking (patients only)
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Doctor editing notes state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');

  // Static doctors list for demo selection
  const dummyDoctors = [
    { id: '60c72b2f9b1d8b2348502390', name: 'Dr. Jane Smith (Cardiology)' },
    { id: '60c72b2f9b1d8b2348502391', name: 'Dr. Alan Walker (Pediatrics)' },
    { id: '60c72b2f9b1d8b2348502392', name: 'Dr. Sarah Connor (General Practice)' }
  ];

  const fetchAppointments = async () => {
    try {
      const data = await appointmentService.getAppointments();
      setAppointments(data);
    } catch (err: any) {
      setError('Failed to fetch appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    try {
      await appointmentService.createAppointment({
        doctorId,
        appointmentDate,
        reason,
        notes
      });
      setSuccessMsg('Appointment booked successfully!');
      setDoctorId('');
      setAppointmentDate('');
      setReason('');
      setNotes('');
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'confirmed' | 'cancelled' | 'completed') => {
    try {
      await appointmentService.updateAppointment(id, { status: newStatus });
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleSaveNotes = async (id: string) => {
    try {
      await appointmentService.updateAppointment(id, { notes: doctorNotes });
      setEditingId(null);
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save notes.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Clinic Schedule</h2>
          <p className="text-slate-500 text-sm">View or schedule appointments here</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg text-emerald-600">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Booking Form - Only visible to patients */}
        {user?.role === 'patient' && (
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6 h-fit">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-sky-600" />
              <span>Book Consultation</span>
            </h3>

            <form onSubmit={handleBook} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Select Practitioner</label>
                <select
                  value={doctorId}
                  onChange={(e) => setDoctorId(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white text-sm"
                >
                  <option value="">-- Choose Doctor --</option>
                  {dummyDoctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date & Time</label>
                <input
                  type="datetime-local"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Routine checkup, headache, physical..."
                  required
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any symptoms, details..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-sm h-20"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white rounded-lg py-2.5 font-bold shadow-md transition-all text-sm"
              >
                Request Booking
              </button>
            </form>
          </div>
        )}

        {/* Appointments List */}
        <div className={user?.role === 'patient' ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Bookings Queue</h3>

            {loading ? (
              <p className="text-slate-400 py-6 text-center">Loading schedules...</p>
            ) : appointments.length === 0 ? (
              <p className="text-slate-400 py-6 text-center">No appointments scheduled.</p>
            ) : (
              <div className="space-y-4">
                {appointments.map((app) => (
                  <div key={app._id} className="border border-slate-100 rounded-xl p-5 hover:bg-slate-50 transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-bold text-slate-800 capitalize">
                          {user?.role === 'patient' ? `Dr. ${app.doctorId.name}` : app.patientId.name}
                        </h4>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                          app.status === 'confirmed' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                          app.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          app.status === 'cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-100' :
                          'bg-yellow-50 text-yellow-700 border border-yellow-100'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      
                      <p className="text-slate-500 text-sm">{formatDate(app.appointmentDate)}</p>
                      <p className="text-slate-700 text-sm font-medium"><span className="text-slate-400">Reason:</span> {app.reason}</p>
                      
                      {/* Notes Section */}
                      {app.notes ? (
                        <div className="p-3 bg-slate-100 rounded-lg border border-slate-200 text-slate-600 text-xs mt-2">
                          <strong className="text-slate-700 font-semibold block mb-1">Clinical Notes:</strong>
                          {app.notes}
                        </div>
                      ) : null}

                      {/* Doctor Editing Notes */}
                      {editingId === app._id ? (
                        <div className="mt-3 flex gap-2">
                          <input 
                            type="text" 
                            value={doctorNotes} 
                            onChange={(e) => setDoctorNotes(e.target.value)} 
                            placeholder="Add prescription, checkup findings..."
                            className="flex-1 text-xs border border-slate-300 rounded p-1.5 focus:outline-none"
                          />
                          <button onClick={() => handleSaveNotes(app._id)} className="bg-sky-600 hover:bg-sky-700 text-white rounded px-3 text-xs font-semibold">Save</button>
                          <button onClick={() => setEditingId(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 rounded px-3 text-xs font-semibold">Cancel</button>
                        </div>
                      ) : null}
                    </div>

                    {/* Actions Panel */}
                    <div className="flex gap-2">
                      {/* Doctor action controls */}
                      {user?.role === 'doctor' && app.status === 'pending' && (
                        <>
                          <button 
                            onClick={() => handleStatusChange(app._id, 'confirmed')} 
                            className="p-2 bg-sky-50 text-sky-600 hover:bg-sky-600 hover:text-white rounded-lg border border-sky-100 transition-colors"
                            title="Confirm"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleStatusChange(app._id, 'cancelled')} 
                            className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg border border-rose-100 transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {user?.role === 'doctor' && app.status === 'confirmed' && (
                        <>
                          <button 
                            onClick={() => { setEditingId(app._id); setDoctorNotes(app.notes || ''); }} 
                            className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5"
                            title="Add Notes"
                          >
                            <FileText className="w-4 h-4" />
                            <span>Add Notes</span>
                          </button>
                          <button 
                            onClick={() => handleStatusChange(app._id, 'completed')} 
                            className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-100 transition-colors text-xs font-semibold"
                            title="Complete Visit"
                          >
                            <span>Mark Complete</span>
                          </button>
                        </>
                      )}

                      {/* Patient cancel controls */}
                      {user?.role === 'patient' && app.status !== 'cancelled' && app.status !== 'completed' && (
                        <button 
                          onClick={() => handleStatusChange(app._id, 'cancelled')} 
                          className="py-1.5 px-3 rounded-lg border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 transition-all text-xs font-bold"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appointments;

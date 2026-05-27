import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Patient, DoctorWithCount } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  patients: Patient[];
  doctors: DoctorWithCount[];
  onSearchPatient: (query: string) => void;
  onRegisterNewPatient: () => void;
}

export const AppointmentModal: React.FC<Props> = ({
  isOpen, onClose, onSubmit, patients, doctors, onSearchPatient, onRegisterNewPatient
}) => {
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [patientSearch, setPatientSearch] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (patientSearch.trim().length >= 2) {
      onSearchPatient(patientSearch);
    }
  }, [patientSearch]);

  // Minimum datetime is now (rounded to next hour)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientId) {
      newErrors.patientId = 'Please select a patient';
    }
    if (!doctorId) {
      newErrors.doctorId = 'Please select a doctor';
    }
    if (!appointmentDate) {
      newErrors.appointmentDate = 'Appointment date is required';
    } else {
      const selectedDate = new Date(appointmentDate);
      if (selectedDate <= new Date()) {
        newErrors.appointmentDate = 'Appointment date must be in the future';
      }
    }
    if (!reason.trim() || reason.trim().length < 3) {
      newErrors.reason = 'Reason must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({ patientId, doctorId, appointmentDate, reason: reason.trim(), notes: notes.trim() });
      setPatientId(''); setDoctorId(''); setAppointmentDate(''); setReason(''); setNotes(''); setPatientSearch('');
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to book appointment');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Book New Appointment</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {serverError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Patient *</label>
            <input type="text" value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Search patient by name, phone, or ID..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mb-1" />
            {patients.length > 0 && patientSearch.trim().length >= 2 && (
              <div className="border border-slate-200 rounded-lg max-h-32 overflow-y-auto">
                {patients.map((p) => (
                  <button key={p._id} type="button"
                    onClick={() => { setPatientId(p._id); setPatientSearch(`${p.name} (${p.patientId})`); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-sky-50 transition-colors border-b border-slate-50 last:border-0 ${
                      patientId === p._id ? 'bg-sky-50 text-sky-700 font-medium' : 'text-slate-700'
                    }`}>
                    <span className="font-medium">{p.name}</span>
                    <span className="text-slate-400 ml-2">{p.patientId}</span>
                    <span className="text-slate-400 ml-2">• {p.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {patientSearch.trim().length >= 2 && patients.length === 0 && (
              <div className="text-sm text-slate-500 p-2">
                No patient found.{' '}
                <button type="button" onClick={onRegisterNewPatient}
                  className="text-sky-600 font-semibold hover:underline">Register new patient</button>
              </div>
            )}
            {errors.patientId && <p className="text-rose-500 text-xs mt-1">{errors.patientId}</p>}
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Doctor *</label>
            <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-sm bg-white ${errors.doctorId ? 'border-rose-400' : 'border-slate-300'}`}>
              <option value="">-- Select Doctor --</option>
              {doctors.map((d) => (
                <option key={d._id || d.id} value={d._id || d.id}>
                  Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''} — {d.activePatientCount} active patients
                </option>
              ))}
            </select>
            {errors.doctorId && <p className="text-rose-500 text-xs mt-1">{errors.doctorId}</p>}
          </div>

          {/* Appointment Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date & Time *</label>
            <input type="datetime-local" value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              min={getMinDateTime()}
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.appointmentDate ? 'border-rose-400' : 'border-slate-300'}`} />
            {errors.appointmentDate && <p className="text-rose-500 text-xs mt-1">{errors.appointmentDate}</p>}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Visit *</label>
            <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
              placeholder="Routine checkup, headache, physical..."
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.reason ? 'border-rose-400' : 'border-slate-300'}`} />
            {errors.reason && <p className="text-rose-500 text-xs mt-1">{errors.reason}</p>}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Notes (optional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Any symptoms, details..."
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-20" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all">
              {submitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;

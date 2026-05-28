import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { Patient, DoctorWithCount } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointmentData: any, patientData?: any) => Promise<void>;
  patients: Patient[];
  doctors: DoctorWithCount[];
  onSearchPatient: (query: string) => void;
}

export const AppointmentModal: React.FC<Props> = ({
  isOpen, onClose, onSubmit, patients, doctors, onSearchPatient
}) => {
  const [isNewPatient, setIsNewPatient] = useState(false);

  // Appointment states
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  // New Patient states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [address, setAddress] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isNewPatient && patientSearch.trim().length >= 2) {
      onSearchPatient(patientSearch);
    }
  }, [patientSearch, isNewPatient, onSearchPatient]);

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(0, 0, 0);
    now.setHours(now.getHours() + 1);
    return now.toISOString().slice(0, 16);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (isNewPatient) {
      if (!name.trim() || name.trim().length < 2) {
        newErrors.name = 'Name must be at least 2 characters';
      }
      if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
        newErrors.name = 'Name must contain only letters, spaces, hyphens, or apostrophes';
      }
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^[0-9+\-() ]{7,15}$/.test(phone.trim())) {
        newErrors.phone = 'Enter a valid phone number (7-15 digits)';
      }
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        newErrors.email = 'Enter a valid email address';
      }
      if (!dateOfBirth) {
        newErrors.dateOfBirth = 'Date of birth is required';
      } else {
        const dob = new Date(dateOfBirth);
        const today = new Date();
        if (dob >= today) {
          newErrors.dateOfBirth = 'Date of birth cannot be in the future';
        }
      }
    } else {
      if (!patientId) {
        newErrors.patientId = 'Please select a patient';
      }
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
      const appointmentData = { patientId, doctorId, appointmentDate, reason: reason.trim(), notes: notes.trim() };
      
      if (isNewPatient) {
        const patientData = { name: name.trim(), phone: phone.trim(), email: email.trim(), dateOfBirth, gender, address: address.trim() };
        await onSubmit(appointmentData, patientData);
      } else {
        await onSubmit(appointmentData);
      }

      // Reset
      setPatientId(''); setDoctorId(''); setAppointmentDate(''); setReason(''); setNotes(''); setPatientSearch('');
      setName(''); setPhone(''); setEmail(''); setDateOfBirth(''); setGender('male'); setAddress('');
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Book Appointment</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {serverError && (
          <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-100 rounded-lg text-rose-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          
          {/* Patient Type Toggle */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setIsNewPatient(false)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                !isNewPatient ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Existing Patient
            </button>
            <button
              type="button"
              onClick={() => setIsNewPatient(true)}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                isNewPatient ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              New Patient
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider">Patient Details</h4>
            
            {!isNewPatient ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Search Patient *</label>
                <input type="text" value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search by name, phone, or ID..."
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-sm mb-1 bg-white" />
                {patients.length > 0 && patientSearch.trim().length >= 2 && (
                  <div className="border border-slate-200 rounded-lg max-h-32 overflow-y-auto bg-white mt-1 shadow-sm">
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
                    No patient found. Switch to "New Patient" to register.
                  </div>
                )}
                {errors.patientId && <p className="text-rose-500 text-xs mt-1">{errors.patientId}</p>}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className={`w-full border rounded-lg p-2.5 text-sm bg-white ${errors.name ? 'border-rose-400' : 'border-slate-300'}`}
                    placeholder="John Doe" />
                  {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
                  <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                    className={`w-full border rounded-lg p-2.5 text-sm bg-white ${errors.phone ? 'border-rose-400' : 'border-slate-300'}`}
                    placeholder="+251 912 345 678" />
                  {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Email (optional)</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={`w-full border rounded-lg p-2.5 text-sm bg-white ${errors.email ? 'border-rose-400' : 'border-slate-300'}`}
                    placeholder="patient@email.com" />
                  {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth *</label>
                  <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full border rounded-lg p-2.5 text-sm bg-white ${errors.dateOfBirth ? 'border-rose-400' : 'border-slate-300'}`} />
                  {errors.dateOfBirth && <p className="text-rose-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Gender *</label>
                  <select value={gender} onChange={(e) => setGender(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Address (optional)</label>
                  <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white"
                    placeholder="City, Country" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-sky-50/50 p-4 rounded-xl space-y-4 border border-sky-100/50">
            <h4 className="text-sm font-bold text-sky-800 uppercase tracking-wider">Appointment Details</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date & Time *</label>
                <input type="datetime-local" value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  min={getMinDateTime()}
                  className={`w-full border rounded-lg p-2.5 text-sm bg-white ${errors.appointmentDate ? 'border-rose-400' : 'border-slate-300'}`} />
                {errors.appointmentDate && <p className="text-rose-500 text-xs mt-1">{errors.appointmentDate}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Reason for Visit *</label>
              <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                placeholder="Routine checkup, headache, physical..."
                className={`w-full border rounded-lg p-2.5 text-sm bg-white ${errors.reason ? 'border-rose-400' : 'border-slate-300'}`} />
              {errors.reason && <p className="text-rose-500 text-xs mt-1">{errors.reason}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Additional Notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Any symptoms, details..."
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-20 bg-white" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all">
              {submitting ? 'Processing...' : (isNewPatient ? 'Register & Book' : 'Book Appointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AppointmentModal;


import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { Patient, DoctorWithCount } from '../types';
import { cn } from '../utils/cn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (appointmentData: any, patientData?: any) => Promise<void>;
  patients: Patient[];
  doctors: DoctorWithCount[];
  onSearchPatient: (query: string) => void;
  /** When provided the doctor selector is hidden and this value is used automatically (for doctors creating their own appointments). */
  defaultDoctorId?: string;
}

export const AppointmentModal: React.FC<Props> = ({
  isOpen, onClose, onSubmit, patients, doctors, onSearchPatient, defaultDoctorId
}) => {
  const [isNewPatient, setIsNewPatient] = useState(false);

  // Appointment states
  const [patientId, setPatientId] = useState('');
  const [doctorId, setDoctorId] = useState(defaultDoctorId || '');
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

  // Keep doctorId in sync when defaultDoctorId changes
  useEffect(() => {
    if (defaultDoctorId) setDoctorId(defaultDoctorId);
  }, [defaultDoctorId]);

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

    if (!doctorId && !defaultDoctorId) {
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

  const inputClasses = (hasError: boolean) => cn(
    "w-full rounded-xl border p-3 text-sm bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:bg-white",
    hasError 
      ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 placeholder:text-rose-300" 
      : "border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-800 placeholder:text-slate-400"
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white rounded-t-3xl z-10 shrink-0">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">Book Appointment</h3>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto p-6 scrollbar-hide flex-1">
              {serverError && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /> {serverError}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Patient Type Toggle */}
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setIsNewPatient(false)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all",
                      !isNewPatient ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    Existing Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewPatient(true)}
                    className={cn(
                      "flex-1 py-2.5 text-sm font-bold rounded-lg transition-all",
                      isNewPatient ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    New Patient
                  </button>
                </div>

                <div className="space-y-5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patient Details</h4>
                  
                  <AnimatePresence mode="wait">
                    {!isNewPatient ? (
                      <motion.div 
                        key="existing"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="relative">
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Search Patient *</label>
                          <input type="text" value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            placeholder="Search by name, phone, or ID..."
                            className={inputClasses(!!errors.patientId)} />
                          
                          {patients.length > 0 && patientSearch.trim().length >= 2 && (
                            <div className="border border-slate-200 rounded-xl max-h-40 overflow-y-auto bg-white mt-2 shadow-lg absolute z-20 w-full">
                              {patients.map((p) => (
                                <button key={p._id} type="button"
                                  onClick={() => { setPatientId(p._id); setPatientSearch(`${p.name} (${p.patientId})`); }}
                                  className={cn(
                                    "w-full text-left px-4 py-3 text-sm transition-colors border-b border-slate-50 last:border-0",
                                    patientId === p._id ? 'bg-sky-50 text-sky-700 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                                  )}>
                                  <span className="font-bold">{p.name}</span>
                                  <span className="text-slate-400 font-mono ml-2 text-xs">{p.patientId}</span>
                                  <span className="text-slate-400 ml-2 font-medium">• {p.phone}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          {patientSearch.trim().length >= 2 && patients.length === 0 && (
                            <div className="text-sm text-slate-500 font-medium p-2 mt-1">
                              No patient found. Switch to "New Patient" to register.
                            </div>
                          )}
                          {errors.patientId && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.patientId}</p>}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="new"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 gap-5"
                      >
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Full Name *</label>
                          <input type="text" value={name} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[a-zA-Z\s'-]*$/.test(val)) setName(val);
                            }}
                            className={inputClasses(!!errors.name)}
                            placeholder="John Doe" />
                          {errors.name && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.name}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phone Number *</label>
                          <input type="text" value={phone} 
                            onChange={(e) => {
                              const val = e.target.value;
                              if (/^[0-9+\-() ]*$/.test(val)) setPhone(val);
                            }}
                            className={inputClasses(!!errors.phone)}
                            placeholder="+251 912 345 678" />
                          {errors.phone && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.phone}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email (optional)</label>
                          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            className={inputClasses(!!errors.email)}
                            placeholder="patient@email.com" />
                          {errors.email && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.email}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date of Birth *</label>
                          <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className={inputClasses(!!errors.dateOfBirth)} />
                          {errors.dateOfBirth && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.dateOfBirth}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Gender *</label>
                          <select value={gender} onChange={(e) => setGender(e.target.value as any)}
                            className={inputClasses(false)}>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Address (optional)</label>
                          <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                            className={inputClasses(false)}
                            placeholder="City, Country" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-5 pt-4 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Appointment Details</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Doctor *</label>
                      {defaultDoctorId ? (
                        <div className={inputClasses(false)}>
                          Dr. {doctors.find((d) => (d._id || d.id) === defaultDoctorId)?.name || '—'}
                        </div>
                      ) : (
                        <>
                          <select value={doctorId} onChange={(e) => setDoctorId(e.target.value)}
                            className={inputClasses(!!errors.doctorId)}>
                            <option value="">-- Select Doctor --</option>
                            {doctors.map((d) => (
                              <option key={d._id || d.id} value={d._id || d.id}>
                                Dr. {d.name} {d.specialization ? `(${d.specialization})` : ''}
                              </option>
                            ))}
                          </select>
                        </>
                      )}
                      {errors.doctorId && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.doctorId}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date & Time *</label>
                      <input type="datetime-local" value={appointmentDate}
                        onChange={(e) => setAppointmentDate(e.target.value)}
                        min={getMinDateTime()}
                        className={inputClasses(!!errors.appointmentDate)} />
                      {errors.appointmentDate && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.appointmentDate}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason for Visit *</label>
                    <input type="text" value={reason} onChange={(e) => setReason(e.target.value)}
                      placeholder="Routine checkup, headache, physical..."
                      className={inputClasses(!!errors.reason)} />
                    {errors.reason && <p className="text-rose-500 text-xs font-medium mt-1.5">{errors.reason}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Additional Notes (optional)</label>
                    <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                      placeholder="Any symptoms, details..."
                      className={cn(inputClasses(false), "h-24 resize-none")} />
                  </div>
                </div>

                <div className="flex gap-4 pt-6 border-t border-slate-100 pb-2">
                  <button type="button" onClick={onClose}
                    className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting}
                    className="flex-1 py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2">
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Processing...
                      </>
                    ) : (isNewPatient ? 'Register & Book' : 'Book Appointment')}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AppointmentModal;


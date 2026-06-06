import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { DoctorWithCount } from '../types';
import { cn } from '../utils/cn';
import DoctorFolderCard from './DoctorFolderCard';

export interface RegistrationPayload {
  patient: {
    name: string;
    phone: string;
    address: string;
    gender: 'male' | 'female' | 'other';
    dateOfBirth: string;
  };
  doctorId: string;
  additionalInfo: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  doctors: DoctorWithCount[];
  onSubmit: (payload: RegistrationPayload) => Promise<void>;
}

/** Converts an age in years to an approximate ISO date of birth (Jan-anchored to today). */
const ageToDateOfBirth = (age: number): string => {
  const now = new Date();
  return new Date(now.getFullYear() - age, now.getMonth(), now.getDate()).toISOString();
};

export const PatientRegistrationModal: React.FC<Props> = ({ isOpen, onClose, doctors, onSubmit }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [doctorId, setDoctorId] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Default-select the most available doctor (doctors arrive sorted fewest-first)
  useEffect(() => {
    if (isOpen && !doctorId && doctors.length > 0) {
      setDoctorId(doctors[0]._id || doctors[0].id);
    }
  }, [isOpen, doctors, doctorId]);

  const selectedDoctor = doctors.find((d) => (d._id || d.id) === doctorId);

  const inputClasses = (hasError?: boolean) =>
    cn(
      'w-full rounded-xl border p-3 text-sm bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:bg-white',
      hasError
        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20 text-rose-900 placeholder:text-rose-300'
        : 'border-slate-200 focus:border-sky-500 focus:ring-sky-500/20 text-slate-800 placeholder:text-slate-400'
    );

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!lastName.trim()) e.lastName = 'Last name is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!/^[0-9+\-() ]{7,15}$/.test(phone.trim())) e.phone = 'Enter a valid phone number';
    const ageNum = Number(age);
    if (!age.trim()) e.age = 'Age is required';
    else if (!Number.isFinite(ageNum) || ageNum <= 0 || ageNum > 120) e.age = 'Enter a valid age';
    if (!doctorId) e.doctorId = 'Select a doctor to assign';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setPhone('');
    setAddress('');
    setAge('');
    setGender('male');
    setDoctorId('');
    setAdditionalInfo('');
    setErrors({});
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setServerError('');
    if (!validate()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        patient: {
          name: `${firstName.trim()} ${lastName.trim()}`.trim(),
          phone: phone.trim(),
          address: address.trim(),
          gender,
          dateOfBirth: ageToDateOfBirth(Number(age)),
        },
        doctorId,
        additionalInfo: additionalInfo.trim(),
      });
      resetForm();
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || err.message || 'Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-100/40 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
            className="relative bg-slate-50/40 backdrop-blur-3xl rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-7 py-5 shrink-0">
              <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">
                Patient Registration Form
              </h3>
              <button
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center bg-white rounded-full shadow-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="overflow-y-auto px-7 pb-7 scrollbar-hide">
              {serverError && (
                <div className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" /> {serverError}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Left: Patient Information */}
                <div className="bg-white rounded-2xl p-6 space-y-4">
                  <h4 className="font-bold text-slate-800">Patient Information</h4>

                  <div>
                    <label className="block text-sm text-slate-500 mb-1.5">First Name</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={inputClasses(!!errors.firstName)}
                    />
                    {errors.firstName && <p className="text-rose-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-1.5">Last Name</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={inputClasses(!!errors.lastName)}
                    />
                    {errors.lastName && <p className="text-rose-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => {
                        if (/^[0-9+\-() ]*$/.test(e.target.value)) setPhone(e.target.value);
                      }}
                      className={inputClasses(!!errors.phone)}
                    />
                    {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <label className="block text-sm text-slate-500 mb-1.5">Address (Optional)</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className={inputClasses(false)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-500 mb-1.5">Age</label>
                      <input
                        type="number"
                        min={0}
                        max={120}
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        className={inputClasses(!!errors.age)}
                      />
                      {errors.age && <p className="text-rose-500 text-xs mt-1">{errors.age}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-slate-500 mb-1.5">Gender</label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value as any)}
                        className={inputClasses(false)}
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-5">
                  {/* Assign Doctor */}
                  <div className="bg-white rounded-2xl p-6">
                    <h4 className="font-bold text-slate-800">Assign Doctor</h4>
                    <p className="text-xs text-slate-400 mt-0.5">Assign a Doctor with the least patients</p>

                    <div className="flex items-end gap-3 mt-4">
                      <div className="flex-1">
                        <label className="block text-sm text-slate-500 mb-1.5">Doctor's Name</label>
                        <div className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-slate-50 text-slate-800 font-semibold truncate">
                          {selectedDoctor ? `Dr. ${selectedDoctor.name}` : '—'}
                        </div>
                      </div>
                      <div className="w-20">
                        <label className="block text-sm text-slate-500 mb-1.5">Patients</label>
                        <div className="w-full rounded-xl border border-slate-200 p-3 text-sm bg-slate-50 text-slate-800 font-bold text-center">
                          {selectedDoctor ? selectedDoctor.activePatientCount : '—'}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-slate-700 mt-5 mb-3">Available Doctors</p>
                    {doctors.length === 0 ? (
                      <p className="text-sm text-slate-400">No doctors available.</p>
                    ) : (
                      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                        {doctors.map((doc, i) => {
                          const id = doc._id || doc.id;
                          return (
                            <div key={id} className="w-40 shrink-0">
                              <DoctorFolderCard
                                doctor={doc}
                                active={i === 0}
                                selectable
                                selected={id === doctorId}
                                onSelect={() => setDoctorId(id)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {errors.doctorId && <p className="text-rose-500 text-xs mt-2">{errors.doctorId}</p>}
                  </div>

                  {/* Additional info + submit */}
                  <div className="bg-white rounded-2xl p-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Additional Information (Optional)
                    </label>
                    <textarea
                      value={additionalInfo}
                      onChange={(e) => setAdditionalInfo(e.target.value)}
                      className={cn(inputClasses(false), 'h-20 resize-none')}
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-4 w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        'Save & Register'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PatientRegistrationModal;

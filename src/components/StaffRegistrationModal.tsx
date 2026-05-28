import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const StaffRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    } else if (!/^[a-zA-Z\s'-]+$/.test(name.trim())) {
      newErrors.name = 'Name must contain only letters, spaces, hyphens, or apostrophes';
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (phone && !/^[0-9+\-() ]{7,15}$/.test(phone.trim())) {
      newErrors.phone = 'Enter a valid phone number (7-15 digits)';
    }
    if (role === 'doctor' && !specialization.trim()) {
      newErrors.specialization = 'Specialization is required for doctors';
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
      await onSubmit({
        name: name.trim(), email: email.trim().toLowerCase(), password,
        role, phone: phone.trim(), specialization: specialization.trim()
      });
      setName(''); setEmail(''); setPassword(''); setRole('doctor'); setPhone(''); setSpecialization('');
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to register staff');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Register New Staff</h3>
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
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name *</label>
            <input type="text" value={name} 
              onChange={(e) => {
                const val = e.target.value;
                if (/^[a-zA-Z\s'-]*$/.test(val)) setName(val);
              }}
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.name ? 'border-rose-400' : 'border-slate-300'}`}
              placeholder="Dr. Jane Smith" />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.email ? 'border-rose-400' : 'border-slate-300'}`}
              placeholder="jane@clinic.com" />
            {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.password ? 'border-rose-400' : 'border-slate-300'}`}
              placeholder="••••••••" />
            {errors.password && <p className="text-rose-500 text-xs mt-1">{errors.password}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Role *</label>
              <select value={role} onChange={(e) => setRole(e.target.value as any)}
                className="w-full border border-slate-300 rounded-lg p-2.5 text-sm bg-white">
                <option value="doctor">Doctor</option>
                <option value="receptionist">Receptionist</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
              <input type="text" value={phone} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9+\-() ]*$/.test(val)) setPhone(val);
                }}
                className={`w-full border rounded-lg p-2.5 text-sm ${errors.phone ? 'border-rose-400' : 'border-slate-300'}`}
                placeholder="+251 9XX" />
              {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
            </div>
          </div>

          {role === 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Specialization *</label>
              <input type="text" value={specialization} onChange={(e) => setSpecialization(e.target.value)}
                className={`w-full border rounded-lg p-2.5 text-sm ${errors.specialization ? 'border-rose-400' : 'border-slate-300'}`}
                placeholder="Cardiology, Pediatrics, General Practice..." />
              {errors.specialization && <p className="text-rose-500 text-xs mt-1">{errors.specialization}</p>}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all">
              {submitting ? 'Registering...' : 'Register Staff'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StaffRegistrationModal;

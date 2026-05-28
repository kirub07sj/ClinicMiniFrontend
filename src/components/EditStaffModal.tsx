import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (id: string, data: any) => Promise<void>;
  initialData: User | null;
}

export const EditStaffModal: React.FC<Props> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState(''); // Optional for update
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setName(initialData.name || '');
      setEmail(initialData.email || '');
      setRole((initialData.role as 'doctor' | 'receptionist') || 'doctor');
      setPhone(initialData.phone || '');
      setSpecialization(initialData.specialization || '');
      setPassword('');
      setErrors({});
      setServerError('');
    }
  }, [isOpen, initialData]);

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
    if (password && password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters (or leave blank)';
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
    if (!initialData) return;
    setServerError('');

    if (!validate()) return;

    setSubmitting(true);
    try {
      const dataToSubmit: any = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role,
        phone: phone.trim(),
        specialization: role === 'doctor' ? specialization.trim() : ''
      };
      if (password) {
        dataToSubmit.password = password;
      }
      await onSubmit(initialData._id || initialData.id, dataToSubmit);
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to update staff');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !initialData) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Edit Staff Member</h3>
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
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">New Password (optional)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.password ? 'border-rose-400' : 'border-slate-300'}`}
              placeholder="Leave blank to keep unchanged" />
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
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
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
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditStaffModal;

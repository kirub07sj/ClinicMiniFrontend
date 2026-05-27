import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const PatientRegistrationModal: React.FC<Props> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

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
      const age = today.getFullYear() - dob.getFullYear();
      if (age > 150) {
        newErrors.dateOfBirth = 'Please enter a realistic date of birth';
      }
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
      await onSubmit({ name: name.trim(), phone: phone.trim(), email: email.trim(), dateOfBirth, gender, address: address.trim() });
      // Reset form
      setName(''); setPhone(''); setEmail(''); setDateOfBirth(''); setGender('male'); setAddress('');
      onClose();
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to register patient');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">Register New Patient</h3>
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
              placeholder="John Doe" />
            {errors.name && <p className="text-rose-500 text-xs mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Phone Number *</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.phone ? 'border-rose-400' : 'border-slate-300'}`}
              placeholder="+251 912 345 678" />
            {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Email (optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className={`w-full border rounded-lg p-2.5 text-sm ${errors.email ? 'border-rose-400' : 'border-slate-300'}`}
              placeholder="patient@email.com" />
            {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Birth *</label>
              <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className={`w-full border rounded-lg p-2.5 text-sm ${errors.dateOfBirth ? 'border-rose-400' : 'border-slate-300'}`} />
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
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Address (optional)</label>
            <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
              placeholder="Addis Ababa, Ethiopia" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-semibold text-sm shadow-md transition-all">
              {submitting ? 'Registering...' : 'Register Patient'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientRegistrationModal;

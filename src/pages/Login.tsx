import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'admin': return '/admin';
      case 'doctor': return '/doctor';
      case 'receptionist': return '/receptionist';
      default: return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      // Read updated user from store after login
      const user = useAuthStore.getState().user;
      navigate(getRedirectPath(user?.role || ''));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-slate-800">Clinic Portal</h2>
        <p className="text-slate-500 mt-2">Sign in to access your dashboard</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg bg-rose-50 border border-rose-100 text-rose-600 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800"
            placeholder="name@clinic.com"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent text-slate-800"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-4 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 text-white font-semibold shadow-md transition-all"
        >
          {isSubmitting ? 'Signing In...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-8 text-center text-xs text-slate-400">
        Contact your system administrator for account access
      </div>
    </div>
  );
};

export default Login;

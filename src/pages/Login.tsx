import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import { cn } from '../utils/cn';

export const Login: React.FC = () => {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      const user = useAuthStore.getState().user;
      navigate(getRedirectPath(user?.role || ''));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="w-full"
    >
      <motion.div variants={itemVariants} className="text-center mb-10">
        <div className="lg:hidden mb-6 text-sky-600 font-extrabold text-3xl tracking-tight">ClinicOS.</div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-slate-500 mt-2 font-medium">Sign in to your account to continue</p>
      </motion.div>

      {error && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 text-sm font-medium flex items-center gap-2"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 transition-all bg-slate-50 hover:bg-slate-100/50 focus:bg-white"
              placeholder="name@clinic.com"
            />
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">Password</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Lock className="w-5 h-5" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-11 pr-12 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 transition-all bg-slate-50 hover:bg-slate-100/50 focus:bg-white"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500 transition-colors" />
            <span className="text-sm font-medium text-slate-600">Remember me</span>
          </label>
          <a href="#" className="text-sm font-semibold text-sky-600 hover:text-sky-700 transition-colors">
            Forgot password?
          </a>
        </motion.div>

        <motion.div variants={itemVariants}>
          <button
            type="submit"
            disabled={isSubmitting}
            className={cn(
              "w-full py-3 px-4 rounded-xl font-bold shadow-sm transition-all flex items-center justify-center gap-2",
              isSubmitting 
                ? "bg-slate-100 text-slate-400 cursor-not-allowed" 
                : "bg-sky-600 hover:bg-sky-700 text-white hover:shadow-md active:scale-[0.98]"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing In...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </motion.div>
      </form>

      <motion.div variants={itemVariants} className="mt-8 text-center text-xs font-medium text-slate-400">
        Contact your system administrator for account access
      </motion.div>
    </motion.div>
  );
};

export default Login;

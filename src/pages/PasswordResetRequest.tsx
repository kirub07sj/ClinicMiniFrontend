import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import authService from '../services/auth.service';
import { cn } from '../utils/cn';

export const PasswordResetRequest: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset. Please try again.');
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
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reset Password</h2>
        <p className="text-slate-500 mt-2 font-medium">We'll notify the admin to reset your password</p>
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

      {success ? (
        <motion.div variants={itemVariants} className="text-center space-y-6">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex flex-col items-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Request Sent Successfully</h3>
            <p className="text-sm text-slate-600 font-medium">
              Your request has been sent to the administrator. They will reset your password to the default shortly.
            </p>
          </div>
          <Link
            to="/login"
            className="w-full py-3 px-4 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Login
          </Link>
        </motion.div>
      ) : (
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
                  Sending Request...
                </>
              ) : (
                'Send Reset Request'
              )}
            </button>
          </motion.div>
          
          <motion.div variants={itemVariants} className="text-center">
            <Link to="/login" className="text-sm font-semibold text-slate-500 hover:text-slate-700 transition-colors inline-flex items-center gap-1.5">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </motion.div>
        </form>
      )}
    </motion.div>
  );
};

export default PasswordResetRequest;

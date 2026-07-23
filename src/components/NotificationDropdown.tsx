import React, { useEffect, useRef } from 'react';
import { Bell, CheckCheck, UserPlus, Key } from 'lucide-react';
import useNotificationStore from '../stores/useNotificationStore';
import { formatDate } from '../utils/format';
import authService from '../services/auth.service';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';

const NotificationDropdown: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [open, setOpen] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [resetTarget, setResetTarget] = React.useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open, fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      markAsRead(id);
    }
  };

  const handleResetPasswordClick = (e: React.MouseEvent, notificationId: string, message: string) => {
    e.stopPropagation();
    // Extract name from message if possible, or just pass a generic placeholder
    // Message format: "John Doe (john@clinic.com) requested a password reset."
    const nameMatch = message.split(' (')[0];
    const name = nameMatch || 'this user';
    setResetTarget({ id: notificationId, name });
  };

  const executePasswordReset = async () => {
    if (!resetTarget) return;
    try {
      await authService.confirmPasswordReset(resetTarget.id);
      toast.success('Password reset successfully!');
      fetchNotifications();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset password');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-full bg-white hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-sky-500 text-white text-[10px] font-bold leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 transition-colors flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-80 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-slate-400">No notifications yet</div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  onClick={() => handleNotificationClick(notification._id, notification.read)}
                  className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                    !notification.read ? 'bg-sky-50/50' : ''
                  }`}
                >
                  <div
                    className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      !notification.read
                        ? 'bg-sky-100 text-sky-600'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {notification.type === 'password_reset' ? <Key className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm leading-snug ${
                        !notification.read ? 'font-semibold text-slate-800' : 'text-slate-600'
                      }`}
                    >
                      {notification.message}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                    {notification.type === 'password_reset' && !notification.read && (
                      <button
                        type="button"
                        onClick={(e) => handleResetPasswordClick(e, notification._id, notification.message)}
                        className="mt-2 px-3 py-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 rounded-md text-xs font-bold transition-colors"
                      >
                        Reset Password
                      </button>
                    )}
                  </div>
                  {!notification.read && (
                    <div className="mt-1 w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Password Reset Confirmation Modal */}
      <ConfirmModal
        isOpen={!!resetTarget}
        onClose={() => setResetTarget(null)}
        onConfirm={executePasswordReset}
        title="Reset Password"
        message={
          <>
            Are you sure you want to reset the password for <span className="font-bold text-slate-800">{resetTarget?.name}</span>? 
            <br className="my-2" />
            Their password will be changed to <span className="font-mono bg-slate-100 px-1 rounded text-slate-700">password123</span> by default.
          </>
        }
        confirmText="Yes, Reset Password"
      />
    </div>
  );
};

export default NotificationDropdown;

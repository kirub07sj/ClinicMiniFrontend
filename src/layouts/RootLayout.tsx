import React from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import { LogOut, Calendar, Home, User as UserIcon } from 'lucide-react';

export const RootLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-sky-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}>
        <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-sky-400'}`} />
        <span className={isActive ? 'font-medium' : ''}>{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col justify-between shadow-xl">
        <div>
          <div className="h-20 flex items-center justify-center border-b border-slate-800 px-6">
            <span className="text-xl font-bold tracking-wider text-sky-400">Clinic Portal</span>
          </div>
          
          <nav className="p-4 space-y-2">
            {user?.role === 'admin' && (
              <>
                <NavLink to="/admin" icon={Home} label="Dashboard" />
              </>
            )}
            {user?.role === 'receptionist' && (
              <>
                <NavLink to="/receptionist" icon={Home} label="Dashboard" />
              </>
            )}
            {user?.role === 'doctor' && (
              <>
                <NavLink to="/doctor" icon={Calendar} label="My Appointments" />
              </>
            )}
          </nav>
        </div>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-sky-400" />
            </div>
            <div className="overflow-hidden">
              <p className="font-semibold text-sm truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white transition-all text-sm font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800 capitalize">{user?.role} Portal</h1>
          <div className="text-slate-500 text-sm">
            Logged in as <span className="font-medium text-slate-800">{user?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RootLayout;

import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../stores/useAuthStore';
import { LogOut, Calendar, Home, User as UserIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export const RootLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link to={to} 
        className={cn(
          "flex items-center rounded-lg transition-all overflow-hidden",
          isCollapsed ? "justify-center p-3" : "gap-3 px-4 py-3",
          isActive ? "bg-sky-600 text-white shadow-md shadow-sky-600/20" : "hover:bg-slate-800 text-slate-300"
        )}
        title={isCollapsed ? label : undefined}
      >
        <Icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-white" : "text-sky-400")} />
        {!isCollapsed && <span className={cn("whitespace-nowrap font-medium", isActive ? "text-white" : "")}>{label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <aside className={cn(
        "bg-slate-900 text-slate-100 flex flex-col justify-between shadow-xl transition-all duration-300 ease-in-out relative z-20 shrink-0",
        isCollapsed ? "w-20" : "w-64"
      )}>
        {/* Toggle Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3.5 top-8 bg-sky-600 text-white rounded-full p-1.5 shadow-md hover:bg-sky-500 transition-colors z-30"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>

        <div>
          <div className="h-20 flex items-center justify-center border-b border-slate-800/80 px-4">
            {isCollapsed ? (
              <span className="text-xl font-bold text-sky-400 bg-sky-400/10 p-2 rounded-lg">CP</span>
            ) : (
              <div className="flex items-center gap-2">
                <span className="bg-sky-400/10 text-sky-400 p-2 rounded-lg font-bold text-lg leading-none">CP</span>
                <span className="text-lg font-bold tracking-wide text-white whitespace-nowrap">Clinic Portal</span>
              </div>
            )}
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
        <div className="p-4 border-t border-slate-800/80">
          <div className={cn("flex items-center mb-4 transition-all", isCollapsed ? "justify-center" : "gap-3 px-2")}>
            <div className="w-10 h-10 shrink-0 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shadow-inner">
              <UserIcon className="w-5 h-5 text-sky-400" />
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="font-bold text-sm text-white truncate">{user?.name}</p>
                <p className="text-xs text-sky-400/80 capitalize font-medium">{user?.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout} 
            title={isCollapsed ? "Sign Out" : undefined}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white transition-all text-sm font-bold shadow-sm",
              isCollapsed ? "px-0" : "px-4"
            )}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0 bg-slate-50">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-extrabold text-slate-800 capitalize tracking-tight truncate">{user?.role} Portal</h1>
          </div>
          <div className="text-slate-500 text-sm hidden sm:flex items-center gap-2 font-medium">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            Logged in as <span className="font-bold text-slate-800 bg-slate-100 px-2 py-1 rounded-md">{user?.email}</span>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 scrollbar-hide">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RootLayout;

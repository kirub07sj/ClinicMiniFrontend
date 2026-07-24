import React, { useState } from 'react';
import { Outlet, useNavigate, useOutletContext } from 'react-router-dom';
import { Search, ChevronDown, LogOut, User } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';
import NotificationDropdown from '../components/NotificationDropdown';

/** Shape of the context the navbar shares with the page below it. */
interface PortalContext {
  searchQuery: string;
  setSearchQuery: (value: string) => void;
}

/** Pages rendered inside PortalLayout read the navbar search through this hook. */
export const usePortalSearch = () => useOutletContext<PortalContext>();

const ToothLogo: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 text-slate-800" fill="currentColor" aria-hidden="true">
    <path d="M7.5 2C5 2 3 4 3 7c0 1.5.3 2.8.7 4.2.3 1 .5 2 .6 3.3.2 2 .4 4 1 5.7.3.9.7 1.8 1.6 1.8.8 0 1.1-.8 1.3-1.6.3-1.2.5-2.6.6-3.7.1-1 .6-1.7 1.6-1.7s1.5.7 1.6 1.7c.1 1.1.3 2.5.6 3.7.2.8.5 1.6 1.3 1.6.9 0 1.3-.9 1.6-1.8.6-1.7.8-3.7 1-5.7.1-1.3.3-2.3.6-3.3.4-1.4.7-2.7.7-4.2 0-3-2-5-4.5-5-1.6 0-2.6.8-4 .8S9.1 2 7.5 2z" />
  </svg>
);

const getInitials = (name?: string): string =>
  (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('') || 'U';

export const PortalLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen bg-slate-100 font-sans flex flex-col overflow-hidden">
      {/* Navbar row */}
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 shrink-0">
        <header className="rounded-2xl px-5 py-3 flex items-center gap-4 flex justify-between">
          {/* Brand */}
          <div className=" flex items-center justify-center gap-2.5 shrink-0">
            <div className="w-10 h-10 bg-white rounded-full bg-slate-100 flex items-center justify-center ">
              <ToothLogo />
            </div>
            <span className="font-extrabold text-lg text-slate-800 tracking-tight hidden sm:block">
              Dentonic
            </span>
          </div>

          <div className="relative flex items-center justify-end flex-1 gap-4">
            {/* Search */}
          {user?.role !== 'admin' && (
            <div className="flex-1 max-w-xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Patient by Phone number, Name, Card ID"
                  className="w-full pl-11 pr-4 py-2.5 rounded-full bg-white border border-slate-100 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:bg-white transition-all"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <NotificationDropdown />

            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-600 font-bold text-xs">
                  {getInitials(user?.name)}
                </div>
                <div className="text-left hidden sm:block leading-tight">
                  <p className="text-sm font-bold text-slate-800">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20">
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          </div>
        </header>
      </div>

      {/* Scrollable page area — white card fills it, scroll lives inside the card */}
      <div className="flex-1 overflow-y-auto scrollbar-transparent max-w-7xl w-full mx-auto px-4 sm:px-6 pb-5 pt-5">
        <Outlet context={{ searchQuery, setSearchQuery } satisfies PortalContext} />
      </div>
    </div>
  );
};

export default PortalLayout;

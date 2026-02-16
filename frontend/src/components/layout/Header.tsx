import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Search, ChevronDown, Settings, LogOut } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import NotificationCenter from './NotificationCenter';

const routeTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/users': 'User Management',
  '/segments': 'Segments',
  '/companies': 'Companies',
  '/contacts': 'Contacts',
  '/approvals': 'Approval Queue',
  '/settings': 'Settings',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const pageTitle = routeTitles[location.pathname] || 'Spanner';

  // Get user initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get primary role
  const getPrimaryRole = (roles: string[]) => {
    return roles[0] || 'User';
  };

  // Close user menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }

    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isUserMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-sm z-10">
      {/* Page Title */}
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white">{pageTitle}</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Command Search Hint */}
        <button
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              ctrlKey: true,
            });
            document.dispatchEvent(event);
          }}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
          <kbd className="text-xs bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-600">⌘K</kbd>
        </button>

        {/* Notification Center */}
        <NotificationCenter />

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-700"></div>

        {/* User Info & Menu */}
        {user && (
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg px-3 py-2 transition-colors"
            >
              {/* User Details */}
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
              </div>

              {/* Avatar */}
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                {getInitials(user.name)}
              </div>

              {/* Role Badge */}
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                {getPrimaryRole(user.roles)}
              </span>

              {/* Dropdown Icon */}
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setIsUserMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
                <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Fallback if no user */}
        {!user && (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">Admin User</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">admin@spanner.app</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
              AU
            </div>
            <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
              Admin
            </span>
          </div>
        )}
      </div>
    </header>
  );
}

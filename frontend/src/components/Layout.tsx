import React, { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import GlobalSearch from './GlobalSearch';

const Layout: React.FC = () => {
  const location = useLocation();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navItems = [
    { label: 'Dashboard', icon: 'dashboard', path: '/', section: 'Main' },
    { label: 'User Management', icon: 'manage_accounts', path: '/users', section: 'Main' },
    { label: 'Segments', icon: 'pie_chart', path: '/segments', section: 'Workspace' },
    { label: 'Companies', icon: 'domain', path: '/companies', section: 'Workspace' },
    { label: 'Contacts', icon: 'group', path: '/contacts', section: 'Workspace' },
    { label: 'Approval Queue', icon: 'fact_check', path: '/approval-queue', section: 'Operations', badge: 12 },
    { label: 'Workbench', icon: 'science', path: '/workbench', section: 'Operations' },
    { label: 'CSV Upload', icon: 'upload_file', path: '/upload', section: 'Operations' },
  ];

  const sections = ['Main', 'Workspace', 'Operations'];

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      <aside className="w-64 flex flex-col bg-white border-r border-slate-200">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 font-semibold" style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}>
              build_circle
            </span>
            <span className="text-xl font-bold tracking-tight text-slate-900">Spanner</span>
          </div>
        </div>
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {sections.map((section) => (
            <React.Fragment key={section}>
              <div className="px-3 mb-2 mt-4 first:mt-0">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{section}</p>
              </div>
              {navItems.filter(item => item.section === section).map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                    location.pathname === item.path
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="material-symbols-outlined mr-3 text-[20px]">{item.icon}</span>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <Link to="/settings" className="flex items-center px-2 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined mr-3 text-[20px]">settings</span>
            Settings
          </Link>
          <Link to="/help" className="flex items-center px-2 py-2 text-sm font-medium text-slate-600 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors">
            <span className="material-symbols-outlined mr-3 text-[20px]">help</span>
            Help & Support
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-slate-800">
              {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">search</span>
              <span>Search...</span>
              <kbd className="hidden sm:inline-block ml-2 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white rounded border border-slate-200">⌘K</kbd>
            </button>
            <button className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
            </button>
            <div className="h-6 w-px bg-slate-200"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-slate-900">Admin User</p>
                <p className="text-xs text-slate-500">admin@spanner.app</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                AU
              </div>
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                Admin
              </span>
              <button className="text-slate-400 hover:text-slate-600">
                <span className="material-symbols-outlined text-xl">expand_more</span>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </div>
  );
};

export default Layout;

import { useState, useEffect } from 'react';
import { Outlet } from 'react-router';
import Sidebar from './Sidebar';
import Header from './Header';
import CommandSearch from './CommandSearch';

export default function AppShell() {
  const [isCommandSearchOpen, setIsCommandSearchOpen] = useState(false);

  // Global keyboard shortcut for Command Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandSearchOpen(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="h-screen flex overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Command Search */}
      <CommandSearch isOpen={isCommandSearchOpen} onClose={() => setIsCommandSearchOpen(false)} />
    </div>
  );
}

import React from 'react';

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalSearch: React.FC<GlobalSearchProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Search Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 mx-4 transition-all">
        {/* Header */}
        <div className="flex items-center px-4 py-4 border-b border-slate-100">
          <span className="material-symbols-outlined text-slate-400 text-2xl mr-3 select-none">search</span>
          <input
            autoFocus
            className="w-full bg-transparent border-none p-0 text-lg text-slate-800 placeholder-slate-400 focus:ring-0 font-medium"
            placeholder="Search Spanner CRM..."
            type="text"
          />
          <div className="hidden sm:flex items-center gap-1">
            <kbd className="px-2 py-1 text-xs font-semibold text-slate-500 bg-slate-100 rounded border border-slate-200 shadow-sm">Esc</kbd>
          </div>
        </div>

        {/* Results */}
        <div className="max-h-[60vh] overflow-y-auto p-2">
          {/* Companies Section */}
          <div className="mb-2">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-white">
              Companies
            </div>
            <div className="group flex items-center justify-between px-3 py-2.5 bg-primary/10 rounded-lg cursor-pointer border-l-4 border-primary transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm border border-slate-100">
                  <span className="material-symbols-outlined text-lg">domain</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-900">Acme Corp</span>
                  <span className="text-xs text-slate-500">Tier 1 Account • San Francisco</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-xl">keyboard_return</span>
            </div>
            <div className="group flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 rounded-lg cursor-pointer border-l-4 border-transparent transition-colors mt-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200">
                  <span className="material-symbols-outlined text-lg">domain</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-primary">Globex Inc</span>
                  <span className="text-xs text-slate-500">Prospect • New York</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-xl opacity-0 group-hover:opacity-100">keyboard_return</span>
            </div>
          </div>

          {/* Contacts Section */}
          <div className="mb-2 mt-4">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider sticky top-0 bg-white">
              Contacts
            </div>
            <div className="group flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 rounded-lg cursor-pointer border-l-4 border-transparent transition-colors">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">AJ</div>
                  <span className="absolute bottom-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white bg-green-400"></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700 group-hover:text-primary">Alice Johnson</span>
                  <span className="text-xs text-slate-500">VP of Marketing @ Acme</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-xl opacity-0 group-hover:opacity-100">keyboard_return</span>
            </div>
          </div>

          {/* Action */}
          <div className="mb-2 mt-4 border-t border-slate-100 pt-2">
            <div className="group flex items-center justify-between px-3 py-2.5 hover:bg-slate-100 rounded-lg cursor-pointer border-l-4 border-transparent transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-lg">add</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-primary">Create new Company...</span>
                  <span className="text-xs text-slate-500">Add a new record to CRM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 shadow-sm min-w-[20px] text-center">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 shadow-sm min-w-[20px] text-center">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white rounded border border-slate-200 shadow-sm">↵</kbd>
              <span>to select</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span>Search powered by</span>
            <span className="font-bold text-slate-400">Algolia</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;

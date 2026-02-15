import React from 'react';

const CsvMappingPage: React.FC = () => {
  return (
    <div className="h-full flex flex-col overflow-hidden -mx-8 -mt-8">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 flex-none z-20">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <span className="material-icons text-primary">table_chart</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Import Contacts</h1>
              <p className="text-xs text-slate-500">Target List: Q3 ABM Prospects</p>
            </div>
          </div>
          {/* Stepper */}
          <div className="hidden md:flex items-center space-x-2">
            <div className="flex items-center text-primary">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold mr-2">✓</span>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="w-12 h-px bg-primary/30"></div>
            <div className="flex items-center text-primary">
              <span className="w-6 h-6 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold mr-2">2</span>
              <span className="text-sm font-medium">Mapping & Validation</span>
            </div>
            <div className="w-12 h-px bg-slate-200"></div>
            <div className="flex items-center text-slate-400">
              <span className="w-6 h-6 rounded-full border-2 border-slate-300 text-xs flex items-center justify-center font-bold mr-2">3</span>
              <span className="text-sm font-medium">Import</span>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-700 text-sm font-medium px-4 py-2 hover:bg-slate-100 rounded-lg">Exit</button>
        </div>
      </header>

      {/* Toolbar & Stats */}
      <div className="flex-none bg-white px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Map & Validate Data</h2>
          <p className="text-sm text-slate-500 mt-1">Review column mappings and fix errors before importing.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-red-50 border border-red-100 px-4 py-2 rounded-lg flex items-center gap-3">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">Validation Status</span>
              <span className="text-sm font-medium text-red-800">12 Errors detected in 5 rows</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer ml-2">
              <input className="sr-only peer" type="checkbox" />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500"></div>
              <span className="ml-2 text-sm font-medium text-slate-600">Show errors only</span>
            </label>
          </div>
          <div className="h-8 w-px bg-slate-200 mx-2"></div>
          <div className="text-right">
            <p className="text-xs text-slate-500">Total Records</p>
            <p className="text-lg font-bold text-slate-800">1,240</p>
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="flex-1 overflow-auto bg-slate-50 p-6">
        <div className="bg-white shadow-sm border border-slate-200 rounded-xl overflow-hidden min-w-[1000px]">
          {/* Sticky Table Header */}
          <div className="sticky top-0 z-10 grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] bg-slate-50 border-b border-slate-200 shadow-sm font-medium text-sm">
            <div className="p-4 flex items-center justify-center border-r border-slate-200">
              <span className="material-icons text-slate-400 text-sm">flag</span>
            </div>
            {[
              { label: 'CSV: Company', matched: true, options: ['Company Name', 'Company Domain', 'Industry'] },
              { label: 'CSV: Contact_Name', matched: true, options: ['Full Name', 'First Name', 'Last Name'] },
              { label: 'CSV: Email_Address', matched: true, options: ['Email Address', 'Work Email', 'Personal Email'] },
              { label: 'CSV: Phone', matched: false, options: ['Work Phone', 'Mobile Phone', 'Company Phone'] },
              { label: 'CSV: Role', matched: true, options: ['Job Title', 'Seniority', 'Department'] }
            ].map((col, idx) => (
              <div key={idx} className={`p-4 border-r border-slate-200 ${idx === 2 ? 'bg-red-50/30' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{col.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${col.matched ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                    {col.matched ? 'Auto-matched' : 'Manual'}
                  </span>
                </div>
                <select className="w-full bg-white border border-primary/50 text-slate-900 text-sm rounded-lg focus:ring-primary focus:border-primary block p-2.5 font-medium shadow-sm">
                  {col.options.map(opt => <option key={opt}>{opt}</option>)}
                  <option>Don't Import</option>
                </select>
              </div>
            ))}
          </div>

          {/* Table Body */}
          <div className="divide-y divide-slate-100 text-sm">
            <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] hover:bg-slate-50 transition-colors">
              <div className="p-3 flex items-center justify-center border-r border-slate-100 text-green-500">
                <span className="material-icons text-lg">check_circle</span>
              </div>
              <div className="p-3 border-r border-slate-100 text-slate-700">Acme Corp</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">Sarah Jenkins</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">sarah.j@acme.com</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">+1 555-0102</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">VP of Sales</div>
            </div>

            <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] bg-red-50/50 hover:bg-red-50 transition-colors">
              <div className="p-3 flex items-center justify-center border-r border-slate-100 text-red-500">
                <span className="material-icons text-lg animate-pulse">error</span>
              </div>
              <div className="p-3 border-r border-slate-100 text-slate-700">Globex Inc.</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">Mike Ross</div>
              <div className="p-2 border-r border-slate-100 relative group">
                <input className="w-full px-2 py-1 bg-white border border-red-300 rounded text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/50" type="text" defaultValue="mike.ross@" />
                <span className="absolute right-3 top-3.5 material-icons text-red-500 text-sm cursor-help">info</span>
              </div>
              <div className="p-3 border-r border-slate-100 text-slate-700">+1 555-0123</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">Associate</div>
            </div>

            <div className="grid grid-cols-[60px_1fr_1fr_1fr_1fr_1fr] hover:bg-slate-50 transition-colors">
              <div className="p-3 flex items-center justify-center border-r border-slate-100 text-green-500">
                <span className="material-icons text-lg">check_circle</span>
              </div>
              <div className="p-3 border-r border-slate-100 text-slate-700">Stark Ind</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">Tony S.</div>
              <div className="p-3 border-r border-slate-100 text-slate-700">tony@stark.com</div>
              <div className="p-3 border-r border-slate-100 text-slate-700"></div>
              <div className="p-3 border-r border-slate-100 text-slate-700">CEO</div>
            </div>
          </div>
          <div className="bg-slate-50 border-t border-slate-200 p-3 text-center">
            <button className="text-sm text-primary font-medium hover:text-blue-700">Load more records...</button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 px-8 py-4 flex-none z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between max-w-full mx-auto">
          <button className="text-slate-600 font-medium px-4 py-2 hover:bg-slate-100 rounded-lg transition-colors">
            Cancel Import
          </button>
          <div className="flex items-center gap-4">
            <button className="px-6 py-2.5 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors">
              Back
            </button>
            <button className="px-6 py-2.5 bg-primary hover:bg-blue-700 text-white font-medium rounded-lg shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
              Import Data
              <span className="material-icons text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CsvMappingPage;

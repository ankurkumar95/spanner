import React from 'react';

interface CompanyDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CompanyDetailDrawer: React.FC<CompanyDetailDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="absolute inset-y-0 right-0 w-full md:w-[42%] bg-white shadow-2xl transform transition-transform duration-300 flex flex-col border-l border-slate-200">
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 bg-white">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">CMP-1024</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Pending Review
                </span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                Acme Corp
                <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">open_in_new</span>
                </button>
              </h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition-colors">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              Approve
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-red-200 text-red-700 hover:bg-red-50 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">block</span>
              Reject
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-md text-sm font-medium shadow-sm transition-colors">
              <span className="material-symbols-outlined text-[18px]">person_add</span>
              Assign
            </button>
            <button className="p-2 border border-slate-300 rounded-md text-slate-500 hover:bg-slate-50">
              <span className="material-symbols-outlined text-[20px]">more_horiz</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto bg-white px-6 py-6 space-y-8">
          <section>
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Company Details</h3>
            <div className="grid grid-cols-2 gap-y-5 gap-x-4">
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Website</label>
                <div className="text-sm text-slate-900 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">language</span>
                  acmecorp.com
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Segment</label>
                <div className="text-sm text-indigo-600 font-medium bg-indigo-50 inline-block px-2 py-0.5 rounded border border-indigo-100">Enterprise Fintech APAC</div>
              </div>
              <div className="group col-span-2">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Description</label>
                <div className="text-sm text-slate-700 leading-relaxed">
                  Acme Corp provides leading financial infrastructure for emerging markets in the Asia-Pacific region. Specializing in cross-border payments and treasury management.
                </div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Industry</label>
                <div className="text-sm text-slate-900">Financial Services</div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Sub-Industry</label>
                <div className="text-sm text-slate-900">Fintech Infrastructure</div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Employees</label>
                <div className="text-sm text-slate-900">1,000 - 5,000</div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">Revenue</label>
                <div className="text-sm text-slate-900">$100M - $500M</div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">HQ Location</label>
                <div className="text-sm text-slate-900">Singapore, SG</div>
              </div>
              <div className="group">
                <label className="block text-xs font-medium text-slate-500 mb-1 group-hover:text-indigo-600 transition-colors">LinkedIn</label>
                <button className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                  linkedin.com/company/acme
                  <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                </button>
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
              <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">Related Contacts (3)</h3>
              <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add
              </button>
            </div>
            <div className="space-y-3">
              {[
                { name: 'John Smith', initials: 'JS', title: 'CTO', status: 'Uploaded', statusColor: 'bg-blue-50 text-blue-700 border-blue-200' },
                { name: 'Sarah Chen', initials: 'SC', title: 'VP of Engineering', status: 'Pending', statusColor: 'bg-amber-50 text-amber-700 border-amber-200' },
              ].map((contact, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50 hover:border-slate-300 transition-all group">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {contact.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-medium text-slate-900 truncate">{contact.name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${contact.statusColor}`}>{contact.status}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{contact.title}</p>
                    <div className="flex items-center gap-3 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">mail</span> Email
                      </button>
                      <button className="text-xs text-slate-400 hover:text-indigo-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="pb-6">
            <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Activity History</h3>
            <div className="relative pl-4 border-l border-slate-200 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] bg-white border-2 border-amber-500 h-2.5 w-2.5 rounded-full"></div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Pending Review</span>
                    <span className="text-xs text-slate-400">Today, 2:30 PM</span>
                  </div>
                  <p className="text-xs text-slate-600">Record flagged for manual verification by system rules.</p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] bg-slate-200 border-2 border-white h-2.5 w-2.5 rounded-full"></div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Details Updated</span>
                    <span className="text-xs text-slate-400">Yesterday, 4:15 PM</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-900">Jane Researcher</span> updated revenue range and employee count.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] bg-slate-200 border-2 border-white h-2.5 w-2.5 rounded-full"></div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-900">Company Created</span>
                    <span className="text-xs text-slate-400">Oct 24, 10:00 AM</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Imported via CSV Upload <span className="font-mono text-[10px] bg-slate-100 px-1 rounded">batch_2023_10_24.csv</span> by <span className="font-medium text-slate-900">Jane Researcher</span>.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
        <div className="border-t border-slate-200 px-6 py-3 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Created Oct 24, 2023</span>
          <span>Last updated 2 hours ago</span>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetailDrawer;

import React from 'react';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InviteUserModal: React.FC<InviteUserModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Invite Team Member</h2>
            <p className="text-sm text-slate-500 mt-1">Grant access to Spanner CRM workspace.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
            <span className="material-icons text-xl">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300 text-slate-400 hover:border-primary hover:text-primary cursor-pointer group transition-colors">
              <span className="material-icons text-2xl group-hover:scale-110 transition-transform">add_a_photo</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700">Profile Photo</h3>
              <p className="text-xs text-slate-500">Optional. Helps identify the user.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700" htmlFor="full-name">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-slate-400 text-[20px]">person</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm"
                  id="full-name"
                  placeholder="e.g. Jane Doe"
                  type="text"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-700" htmlFor="email">Work Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-icons text-slate-400 text-[20px]">email</span>
                </div>
                <input
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary sm:text-sm"
                  id="email"
                  placeholder="jane@company.com"
                  type="email"
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">Assign Role</label>
                <button className="text-xs text-primary hover:underline">View permissions guide</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'admin', label: 'Admin', desc: 'Full workspace access & settings.' },
                  { id: 'researcher', label: 'Researcher', desc: 'Can view & edit lead data.' },
                  { id: 'sdr', label: 'SDR', desc: 'Limited to outreach tools.' },
                ].map((role) => (
                  <label key={role.id} className={`relative flex flex-col p-3 border rounded-lg cursor-pointer transition-all hover:bg-slate-50 ${role.id === 'admin' ? 'border-primary bg-primary/5' : 'border-slate-200'}`}>
                    <input defaultChecked={role.id === 'admin'} className="peer sr-only" name="role" type="checkbox" value={role.id} />
                    <div className={`absolute top-3 right-3 h-4 w-4 rounded-full border flex items-center justify-center ${role.id === 'admin' ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                      <span className="material-icons text-white text-[10px] font-bold">check</span>
                    </div>
                    <span className={`font-medium text-sm mb-1 ${role.id === 'admin' ? 'text-primary' : 'text-slate-900'}`}>{role.label}</span>
                    <span className="text-xs text-slate-500 leading-snug">{role.desc}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input className="rounded border-slate-300 text-primary focus:ring-primary h-4 w-4" id="notify" type="checkbox" />
            <label className="text-sm text-slate-600 select-none" htmlFor="notify">Send a welcome email with onboarding instructions.</label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-all">
            Cancel
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary-hover shadow-sm transition-all flex items-center gap-2">
            <span className="material-icons text-sm">send</span>
            Send Invitation
          </button>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal;

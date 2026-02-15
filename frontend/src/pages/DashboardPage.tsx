import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Welcome back, Admin</h2>
        <p className="mt-1 text-sm text-slate-500">Here's what's happening in your workspace today.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm border-l-4 border-l-amber-400">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Companies</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">24</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <span className="material-symbols-outlined text-amber-600">domain_verification</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-amber-600 font-medium flex items-center">
              <span className="material-symbols-outlined text-sm mr-1">arrow_upward</span>
              12%
            </span>
            <span className="ml-2 text-slate-400">vs last week</span>
            <button className="ml-auto text-blue-600 hover:text-blue-700 text-sm font-medium">Review queue →</button>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm border-l-4 border-l-green-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Approved Contacts</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">1,284</p>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <span className="material-symbols-outlined text-green-600">check_circle</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-green-600 font-medium flex items-center">
              <span className="material-symbols-outlined text-sm mr-1">arrow_upward</span>
              8%
            </span>
            <span className="ml-2 text-slate-400">vs last week</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm border-l-4 border-l-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-slate-500">Active Segments</p>
              <p className="mt-2 text-3xl font-semibold text-slate-900">8</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <span className="material-symbols-outlined text-blue-600">pie_chart</span>
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-slate-500 font-medium">3 archived</span>
            <span className="ml-2 text-slate-400">total</span>
            <button className="ml-auto text-blue-600 hover:text-blue-700 text-sm font-medium">View all →</button>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-900">Pipeline Velocity</h3>
            <select className="text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1">
              <option>Last 30 Days</option>
              <option>This Quarter</option>
              <option>Year to Date</option>
            </select>
          </div>
          <div className="relative h-64 w-full bg-slate-50 rounded flex items-end justify-between px-8 pb-4 gap-4">
            <div className="w-full bg-blue-100 rounded-t hover:bg-blue-200 transition-colors relative group h-[40%]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">Research</div>
            </div>
            <div className="w-full bg-blue-200 rounded-t hover:bg-blue-300 transition-colors relative group h-[65%]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">Approvals</div>
            </div>
            <div className="w-full bg-blue-300 rounded-t hover:bg-blue-400 transition-colors relative group h-[55%]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">SDR Handoff</div>
            </div>
            <div className="w-full bg-blue-400 rounded-t hover:bg-blue-500 transition-colors relative group h-[80%]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">Meetings</div>
            </div>
            <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative group h-[30%]">
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">Closed</div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500 px-2">
            <span>Research</span>
            <span>Approval</span>
            <span>Handoff</span>
            <span>Meeting</span>
            <span>Closed</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="flow-root">
            <ul className="-mb-8" role="list">
              {[
                { title: 'Approved Acme Corp', time: '1h ago', icon: 'check', color: 'bg-green-100', iconColor: 'text-green-600' },
                { title: 'Jane R. uploaded contacts.csv', time: '3h ago', icon: 'upload_file', color: 'bg-blue-100', iconColor: 'text-blue-600' },
                { title: 'Meeting scheduled with GlobalTech', time: '5h ago', icon: 'event', color: 'bg-purple-100', iconColor: 'text-purple-600' },
                { title: '12 duplicates detected in Fintech Import', time: '1d ago', icon: 'warning', color: 'bg-amber-100', iconColor: 'text-amber-600' },
              ].map((activity, idx) => (
                <li key={idx}>
                  <div className="relative pb-8">
                    {idx !== 3 && <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-slate-200"></span>}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full ${activity.color} flex items-center justify-center ring-8 ring-white`}>
                          <span className={`material-symbols-outlined ${activity.iconColor} text-sm`}>{activity.icon}</span>
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm text-slate-500">{activity.title}</p>
                        </div>
                        <div className="whitespace-nowrap text-right text-xs text-slate-500">{activity.time}</div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

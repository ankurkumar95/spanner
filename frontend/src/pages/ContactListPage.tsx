import React from 'react';
import { Link } from 'react-router-dom';

const ContactListPage: React.FC = () => {
  const contacts = [
    { name: 'Sarah Johnson', title: 'VP Sales', email: 'sarah.j@globaltech.com', company: 'GlobalTech Solutions', initial: 'G', companyColor: 'bg-blue-100 text-blue-700', segment: 'Enterprise Fintech APAC', status: 'Approved', badgeColor: 'bg-green-50 text-green-700 border-green-200', sdr: 'Alice SDR', sdrInitial: 'A' },
    { name: 'John Smith', title: 'CTO', email: 'jsmith@acmecorp.com', company: 'Acme Corp', initial: 'A', companyColor: 'bg-red-100 text-red-700', segment: 'Mid-Market Healthcare US', status: 'Assigned to SDR', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200', sdr: 'Alice SDR', sdrInitial: 'A' },
    { name: 'Mike Chen', title: 'Director of Marketing', email: 'mike.chen@novapay.io', company: 'NovaPay Financial', initial: 'N', companyColor: 'bg-indigo-100 text-indigo-700', segment: 'Startup SaaS Europe', status: 'Uploaded', badgeColor: 'bg-blue-50 text-blue-700 border-blue-200', sdr: 'Unassigned', sdrInitial: '?' },
    { name: 'Emily Davis', title: 'COO', email: 'emily.davis@medicare.sys', company: 'MediCare Systems', initial: 'M', companyColor: 'bg-green-100 text-green-700', segment: 'Mid-Market Healthcare US', status: 'Meeting Scheduled', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200', sdr: 'Alice SDR', sdrInitial: 'A' },
    { name: 'David Wilson', title: 'Engineering Lead', email: 'dwilson@cloudfirst.io', company: 'CloudFirst Inc', initial: 'C', companyColor: 'bg-purple-100 text-purple-700', segment: 'Startup SaaS Europe', status: 'Pending', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200', sdr: 'Unassigned', sdrInitial: '?' },
    { name: 'Jessica Wong', title: 'Head of Operations', email: 'jess.wong@acmecorp.com', company: 'Acme Corp', initial: 'A', companyColor: 'bg-red-100 text-red-700', segment: 'Mid-Market Healthcare US', status: 'Approved', badgeColor: 'bg-green-50 text-green-700 border-green-200', sdr: 'Unassigned', sdrInitial: '?' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="px-8 py-4 bg-white border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between -mx-8 -mt-8 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
              <span className="material-symbols-outlined !text-lg">search</span>
            </span>
            <input
              className="w-full py-2 pl-10 pr-3 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 placeholder-gray-400"
              placeholder="Search contacts..."
              type="text"
            />
          </div>
          <div className="h-6 w-px bg-gray-200 mx-1"></div>
          <select
            defaultValue=""
            className="py-2 pl-3 pr-8 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-600 min-w-[140px]"
          >
            <option disabled value="">Company</option>
            <option>Acme Corp</option>
            <option>GlobalTech Solutions</option>
            <option>NovaPay Financial</option>
          </select>
          <select
            defaultValue=""
            className="py-2 pl-3 pr-8 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-600 min-w-[140px]"
          >
            <option disabled value="">Segment</option>
            <option>Enterprise Fintech APAC</option>
            <option>Mid-Market Healthcare US</option>
            <option>Startup SaaS Europe</option>
          </select>
          <select
            defaultValue=""
            className="py-2 pl-3 pr-8 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-600 min-w-[140px]"
          >
            <option disabled value="">Status</option>
            <option>Approved</option>
            <option>Uploaded</option>
            <option>Assigned to SDR</option>
            <option>Meeting Scheduled</option>
          </select>
          <select
            defaultValue=""
            className="py-2 pl-3 pr-8 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-white text-gray-600 min-w-[140px]"
          >
            <option disabled value="">SDR</option>
            <option>Alice SDR</option>
            <option>Unassigned</option>
          </select>
          <div className="relative min-w-[140px]">
            <input
              className="w-full py-2 pl-3 pr-2 text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-600"
              placeholder="Created Date"
              type="date"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" type="checkbox" />
            <span>Show Duplicates</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" type="checkbox" />
            <span>Show Deactivated</span>
          </label>
        </div>
        <div className="flex items-center gap-4 ml-auto">
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
            <span className="material-symbols-outlined !text-lg">download</span>
            Export CSV
          </button>
          <Link to="/contacts/add" className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors shadow-sm">
            <span className="material-symbols-outlined !text-lg">add</span>
            Create Contact
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50 w-10" scope="col">
                <input className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" type="checkbox" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50" scope="col">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50" scope="col">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50" scope="col">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50" scope="col">Segment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50" scope="col">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50" scope="col">Assigned SDR</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200 bg-gray-50" scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {contacts.map((contact, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input className="form-checkbox h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" type="checkbox" onClick={(e) => e.stopPropagation()} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                  <div className="flex flex-col">
                    <span className="font-medium text-gray-900">{contact.name}</span>
                    <span className="text-xs text-gray-500">{contact.title}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 border-b border-gray-100">{contact.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${contact.companyColor}`}>
                      {contact.initial}
                    </div>
                    <span className="text-gray-900">{contact.company}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                    {contact.segment}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${contact.badgeColor}`}>
                    {contact.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    {contact.sdr !== 'Unassigned' ? (
                      <>
                        <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] font-bold">
                          {contact.sdrInitial}
                        </div>
                        <span>{contact.sdr}</span>
                      </>
                    ) : (
                      <span className="italic text-gray-400">Unassigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-100 text-right">
                  <button className="text-gray-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined">more_horiz</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-center items-center">
          <span className="text-xs text-gray-500 flex items-center gap-2">
            <span className="block w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
            Loading more contacts...
          </span>
        </div>
      </div>
    </div>
  );
};

export default ContactListPage;

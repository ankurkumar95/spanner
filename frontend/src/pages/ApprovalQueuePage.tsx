import React from 'react';

const ApprovalQueuePage: React.FC = () => {
  const pendingCompanies = [
    { name: 'NovaPay Financial', domain: 'novapay.io', initial: 'N', segment: 'Enterprise Fintech APAC', priority: 'High Priority', status: 'Pending Approval', researcher: 'Jane Researcher', uploadDate: 'Oct 12, 2023' },
    { name: 'GlobalTech Solutions', domain: 'globaltech.com', initial: 'G', segment: 'Startup SaaS Europe', status: 'Pending Approval', researcher: 'Jane Researcher', uploadDate: 'Oct 11, 2023' },
    { name: 'Acme Corp', domain: 'acmecorp.net', initial: 'A', segment: 'Mid-Market Healthcare US', status: 'Pending Approval', researcher: 'Tom Scout', uploadDate: 'Oct 10, 2023' },
    { name: 'MediCare Systems', domain: 'medicaresys.com', initial: 'M', segment: 'Mid-Market Healthcare US', status: 'Pending Approval', researcher: 'Jane Researcher', uploadDate: 'Oct 09, 2023' },
    { name: 'CloudFirst Inc', domain: 'cloudfirst.io', initial: 'C', segment: 'Startup SaaS Europe', status: 'Pending Approval', researcher: 'Tom Scout', uploadDate: 'Oct 08, 2023' },
  ];

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-gray-200 mb-6 -mt-8 -mx-8 bg-white px-8 pt-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-4">Approval Queue</h1>
        <nav aria-label="Tabs" className="-mb-px flex space-x-8">
          <button className="border-primary text-primary whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center">
            Pending Companies
            <span className="bg-blue-100 text-blue-600 hidden ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">12</span>
          </button>
          <button className="border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center">
            Uploaded Contacts
            <span className="bg-gray-100 text-gray-900 hidden ml-3 py-0.5 px-2.5 rounded-full text-xs font-medium md:inline-block">45</span>
          </button>
        </nav>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6 shadow-sm flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative rounded-md shadow-sm max-w-xs w-full">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            </div>
            <input
              className="focus:ring-primary focus:border-primary block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search companies..."
              type="text"
            />
          </div>
          <div className="h-8 w-px bg-gray-200 mx-1"></div>
          <select className="block w-full max-w-[180px] pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            <option>All Segments</option>
            <option>Enterprise Fintech APAC</option>
            <option>Mid-Market Healthcare US</option>
            <option>Startup SaaS Europe</option>
          </select>
          <select className="block w-full max-w-[180px] pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md">
            <option>All Researchers</option>
            <option>Jane Researcher</option>
            <option>Tom Scout</option>
          </select>
          <button className="relative w-full max-w-[150px] bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm">
            <span className="block truncate text-gray-500">Date Range</span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">calendar_today</span>
            </span>
          </button>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500 mr-2">Showing 1-10 of 12</span>
          <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-400 disabled:opacity-50">
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 text-gray-600">
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Company Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Segment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Researcher</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" scope="col">Upload Date</th>
              <th className="relative px-6 py-3" scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {pendingCompanies.map((company, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 rounded bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-lg">
                      {company.initial}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{company.name}</div>
                      <div className="text-sm text-gray-500">{company.domain}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{company.segment}</div>
                  {company.priority && <div className="text-xs text-gray-500 mt-0.5">{company.priority}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                    {company.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {company.researcher}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {company.uploadDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <button className="bg-green-50 text-green-700 hover:bg-green-100 border border-transparent rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center">
                      <span className="material-symbols-outlined text-[16px] mr-1">check</span>
                      Approve
                    </button>
                    <button className="bg-red-50 text-red-700 hover:bg-red-100 border border-transparent rounded-md px-3 py-1.5 text-xs font-medium transition-colors flex items-center">
                      <span className="material-symbols-outlined text-[16px] mr-1">close</span>
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">End of pending list. Nice work!</p>
        </div>
      </div>
    </div>
  );
};

export default ApprovalQueuePage;

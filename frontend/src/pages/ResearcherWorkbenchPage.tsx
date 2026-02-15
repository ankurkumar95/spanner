import React from 'react';
import { Link } from 'react-router-dom';

const ResearcherWorkbenchPage: React.FC = () => {
  const mySegments = [
    { name: 'Enterprise Fintech APAC', offerings: ['Cloud Migration', 'Fintech'], approvedCompanies: 24, contacts: 112 },
    { name: 'Mid-Market Healthcare US', offerings: ['Data Analytics', 'Healthcare'], approvedCompanies: 15, contacts: 48 },
    { name: 'Startup SaaS Europe', offerings: ['Managed Security', 'SaaS'], approvedCompanies: 32, contacts: 86 },
  ];

  const recentUploads = [
    { name: 'contacts_apac_fintech_v2.csv', date: 'Oct 24, 2023 10:30 AM', type: 'Contacts', status: 'Completed', statusColor: 'bg-green-100 text-green-800', summary: '245 Imported | 3 Failed', icon: 'description', iconColor: 'text-green-500' },
    { name: 'companies_healthcare_us.csv', date: 'Oct 23, 2023 04:15 PM', type: 'Companies', status: 'Processing', statusColor: 'bg-amber-100 text-amber-800', summary: '45% Complete', icon: 'description', iconColor: 'text-amber-500', progress: 45 },
    { name: 'saas_europe_leads_batch1.csv', date: 'Oct 22, 2023 09:00 AM', type: 'Contacts', status: 'Errors Found', statusColor: 'bg-red-100 text-red-800', summary: '0 Imported | 124 Failed', icon: 'description', iconColor: 'text-red-500', action: 'Fix Errors' },
    { name: 'legacy_data_import.csv', date: 'Oct 20, 2023 02:20 PM', type: 'Companies', status: 'Completed', statusColor: 'bg-green-100 text-green-800', summary: '56 Imported | 0 Failed', icon: 'description', iconColor: 'text-green-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, Jane</h2>
        <p className="text-gray-500 mt-1">Here's what's happening in your assigned segments today.</p>
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400 text-xl">folder_shared</span>
            My Segments
          </h3>
          <Link className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" to="/segments">View all segments</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mySegments.map((segment, index) => (
            <div key={index} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:border-blue-300 transition-colors cursor-pointer group">
              <div className="flex justify-between items-start mb-3">
                <div className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">{segment.name}</div>
                <span className="material-symbols-outlined text-gray-300 group-hover:text-blue-400">arrow_forward</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-6">
                {segment.offerings.map((offering, idx) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">{offering}</span>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                <div>
                  <div className="text-sm text-gray-500">Approved Companies</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{segment.approvedCompanies}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">Contacts</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{segment.contacts}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 mt-8">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-400 text-xl">cloud_upload</span>
            My Uploads
          </h3>
          <Link to="/upload" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Import
          </Link>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">File Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" scope="col">Summary</th>
                  <th className="relative px-6 py-3" scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentUploads.map((upload, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className={`material-symbols-outlined ${upload.iconColor} mr-2`}>{upload.icon}</span>
                        <div className="text-sm font-medium text-gray-900">{upload.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {upload.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {upload.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${upload.statusColor}`}>
                        {upload.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {upload.progress ? (
                        <>
                          <div className="w-24 bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${upload.progress}%` }}></div>
                          </div>
                          <span className="text-xs text-gray-500 mt-1 block">{upload.summary}</span>
                        </>
                      ) : (
                        <div className="flex gap-3 text-xs">
                          {upload.summary}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {upload.action ? (
                        <button className="text-red-600 hover:text-red-800 font-medium">{upload.action}</button>
                      ) : (
                        <button className="text-blue-600 hover:text-blue-900" disabled={upload.status === 'Processing'}>View Report</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <div className="text-xs text-gray-500">Showing last 4 uploads</div>
            <button className="text-xs font-medium text-blue-600 hover:text-blue-800">View all upload history</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResearcherWorkbenchPage;

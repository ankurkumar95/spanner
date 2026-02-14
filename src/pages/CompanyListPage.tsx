import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import CompanyDetailDrawer from '../components/CompanyDetailDrawer';

const CompanyListPage: React.FC = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const companies = [
    { name: 'Acme Corp', initial: 'AC', segment: 'Enterprise Fintech APAC', status: 'Approved', industry: 'Financial Services', createdBy: 'Jane R.', createdAt: 'Oct 24, 2023' },
    { name: 'GlobalTech Solutions', initial: 'GT', segment: 'Mid-Market Healthcare US', status: 'Pending', industry: 'Healthcare IT', createdBy: 'Prashant A.', createdAt: 'Oct 23, 2023' },
    { name: 'NovaPay Financial', initial: 'NP', segment: 'Enterprise Fintech APAC', status: 'Rejected', industry: 'Fintech', createdBy: 'Jane R.', createdAt: 'Oct 22, 2023', rejected: true },
    { name: 'MediCare Systems', initial: 'MS', segment: 'Mid-Market Healthcare US', status: 'Approved', industry: 'Medical Devices', createdBy: 'Prashant A.', createdAt: 'Oct 21, 2023' },
    { name: 'CloudFirst Inc', initial: 'CF', segment: 'Startup SaaS Europe', status: 'Pending', industry: 'SaaS', createdBy: 'Jane R.', createdAt: 'Oct 20, 2023' },
    { name: 'SoftInnovate', initial: 'SI', segment: 'Startup SaaS Europe', status: 'Approved', industry: 'Cybersecurity', createdBy: 'Jane R.', createdAt: 'Oct 19, 2023' },
    { name: 'DataLogic Inc', initial: 'DL', segment: 'Enterprise Fintech APAC', status: 'Approved', industry: 'Data Analytics', createdBy: 'Prashant A.', createdAt: 'Oct 18, 2023' },
    { name: 'BlueWave Media', initial: 'BW', segment: 'Mid-Market Healthcare US', status: 'Pending', industry: 'Marketing Tech', createdBy: 'Prashant A.', createdAt: 'Oct 18, 2023' },
  ];

  return (
    <div className="flex flex-col h-full relative">
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex flex-wrap items-center justify-between gap-4 -mx-8 -mt-8 mb-6">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative rounded-md shadow-sm w-64">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
            </div>
            <input
              className="block w-full rounded-md border-slate-300 pl-10 focus:border-brand-500 focus:ring-brand-500 sm:text-sm py-2"
              id="search"
              name="search"
              placeholder="Search companies..."
              type="text"
            />
          </div>
          <div className="h-8 w-px bg-slate-300 mx-1"></div>
          <select className="block rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm">
            <option>All Segments</option>
            <option>Enterprise Fintech APAC</option>
            <option>Mid-Market Healthcare US</option>
            <option>Startup SaaS Europe</option>
          </select>
          <select className="block rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm">
            <option>All Statuses</option>
            <option>Approved</option>
            <option>Pending</option>
            <option>Rejected</option>
          </select>
          <select className="block rounded-md border-slate-300 py-2 pl-3 pr-10 text-base focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm">
            <option>All Researchers</option>
            <option>Jane Researcher</option>
            <option>John Doe</option>
            <option>Sarah Smith</option>
          </select>
          <div className="flex items-center space-x-4 ml-2">
            <label className="inline-flex items-center text-sm text-slate-600 cursor-pointer">
              <input className="checkbox-custom mr-2" type="checkbox" />
              Show Duplicates
            </label>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2" type="button">
            <span className="material-symbols-outlined mr-2 text-[20px]">download</span>
            Export CSV
          </button>
          <Link to="/companies/add" className="inline-flex items-center rounded-md border border-transparent bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2">
            <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
            Add Company
          </Link>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-slate-200 table-dense">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-8 py-3 pl-4 pr-3 sm:pl-6" scope="col">
                <input className="checkbox-custom" type="checkbox" />
              </th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Company Name</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Segment</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Status</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Industry</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Created By</th>
              <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider" scope="col">Created At</th>
              <th className="relative py-3 pl-3 pr-4 sm:pr-6" scope="col">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {companies.map((company, index) => (
              <tr key={index} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => setIsDrawerOpen(true)}>
                <td className="pl-4 pr-3 sm:pl-6 align-middle">
                  <input className="checkbox-custom" type="checkbox" onClick={(e) => e.stopPropagation()} />
                </td>
                <td className="whitespace-nowrap align-middle">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs mr-3 border border-slate-200">
                      {company.initial}
                    </div>
                    <div className={`text-sm font-medium ${company.rejected ? 'text-slate-500 line-through decoration-slate-400' : 'text-slate-900'}`}>
                      {company.name}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap align-middle">
                  <div className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block max-w-[180px] truncate" title={company.segment}>
                    {company.segment}
                  </div>
                </td>
                <td className="whitespace-nowrap align-middle">
                  <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    company.status === 'Approved' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                    company.status === 'Pending' ? 'bg-amber-50 text-amber-700 ring-amber-600/20' :
                    'bg-red-50 text-red-700 ring-red-600/20'
                  }`}>
                    {company.status}
                  </span>
                </td>
                <td className="whitespace-nowrap align-middle">
                  <div className="text-sm text-slate-600">{company.industry}</div>
                </td>
                <td className="whitespace-nowrap align-middle">
                  <div className="flex items-center">
                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 mr-2">
                      {company.createdBy.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-sm text-slate-600">{company.createdBy}</span>
                  </div>
                </td>
                <td className="whitespace-nowrap align-middle">
                  <div className="text-sm text-slate-500">{company.createdAt}</div>
                </td>
                <td className="whitespace-nowrap align-middle text-right pr-4 sm:pr-6">
                  <button className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="py-6 flex justify-center">
        <span className="material-symbols-outlined animate-spin text-slate-400">progress_activity</span>
      </div>

      <CompanyDetailDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  );
};

export default CompanyListPage;

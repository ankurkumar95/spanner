import React, { useState } from 'react';
import InviteUserModal from '../components/InviteUserModal';

const UserManagementPage: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const users = [
    { name: 'Admin User', email: 'admin@spanner.app', initial: 'AU', roles: ['Admin'], status: 'Active', createdAt: 'Oct 12, 2023', color: 'bg-indigo-100 text-indigo-700' },
    { name: 'Prashant Agarwal', email: 'prashant@spanner.app', initial: 'PA', roles: ['Segment Owner'], status: 'Active', createdAt: 'Oct 14, 2023', color: 'bg-purple-100 text-purple-700' },
    { name: 'Jane Researcher', email: 'jane@spanner.app', initial: 'JR', roles: ['Researcher'], status: 'Active', createdAt: 'Oct 15, 2023', color: 'bg-blue-100 text-blue-700' },
    { name: 'Bob Approver', email: 'bob@spanner.app', initial: 'BA', roles: ['Approver'], status: 'Active', createdAt: 'Oct 18, 2023', color: 'bg-amber-100 text-amber-700' },
    { name: 'Alice SDR', email: 'alice@spanner.app', initial: 'AS', roles: ['SDR'], status: 'Inactive', createdAt: 'Oct 20, 2023', color: 'bg-green-100 text-green-700' },
    { name: 'Maria Marketing', email: 'maria@spanner.app', initial: 'MM', roles: ['Marketing'], status: 'Active', createdAt: 'Oct 22, 2023', color: 'bg-pink-100 text-pink-700' },
    { name: 'David Lead', email: 'david@spanner.app', initial: 'DL', roles: ['Segment Owner', 'Approver'], status: 'Active', createdAt: 'Nov 01, 2023', color: 'bg-teal-100 text-teal-700' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 -mt-8 -mx-8 bg-white border-b border-slate-200 px-8 py-4 mb-6">
        <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-500 relative">
            <span className="material-symbols-outlined">notifications</span>
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-500">
            <span className="material-symbols-outlined">help</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            </div>
            <input
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
              placeholder="Search by name or email"
              type="text"
            />
          </div>
          <select className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white text-gray-600">
            <option>All Roles</option>
            <option>Admin</option>
            <option>Segment Owner</option>
            <option>Researcher</option>
            <option>Approver</option>
            <option>SDR</option>
            <option>Marketing</option>
          </select>
          <select className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md bg-white text-gray-600">
            <option>All Statuses</option>
            <option>Active</option>
            <option>Inactive</option>
          </select>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary-dark transition-colors"
        >
          <span className="material-symbols-outlined text-[18px] mr-2">add</span>
          Create User
        </button>
      </div>

      <div className="bg-white shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg overflow-hidden">
        <div className="min-w-full inline-block align-middle">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]" scope="col">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[25%]" scope="col">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[20%]" scope="col">Role(s)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[10%]" scope="col">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-[15%]" scope="col">Created At</th>
                <th className="relative px-6 py-3 w-[5%]" scope="col"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-9 w-9 rounded-full ${user.color} flex items-center justify-center font-bold text-xs mr-3`}>
                        {user.initial}
                      </div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-normal text-sm text-gray-500">
                    {user.roles.map((role, idx) => (
                      <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 mr-1 mb-1 border border-gray-200">
                        {role}
                      </span>
                    ))}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.createdAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button className="text-gray-400 hover:text-gray-600">
                      <span className="material-symbols-outlined text-[20px]">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 shadow-sm rounded-lg">
        <div className="flex flex-1 justify-between sm:hidden">
          <button className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Previous</button>
          <button className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Next</button>
        </div>
        <div className="hidden sm:flex flex-1 items-center justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">1</span> to <span className="font-medium">7</span> of <span className="font-medium">24</span> results
            </p>
          </div>
          <nav aria-label="Pagination" className="isolate inline-flex -space-x-px rounded-md shadow-sm">
            <button className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              <span className="sr-only">Previous</span>
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button className="relative z-10 inline-flex items-center bg-primary px-4 py-2 text-sm font-semibold text-white">1</button>
            <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">2</button>
            <button className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">3</button>
            <button className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
              <span className="sr-only">Next</span>
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </nav>
        </div>
      </div>

      <InviteUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default UserManagementPage;

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, Mail, Calendar, X } from 'lucide-react';
import { useUsers, useUser, useCreateUser, useUpdateUser } from '../hooks/useUsers';
import {
  DataTable,
  FilterBar,
  SidePanel,
  Pagination,
  LoadingSpinner,
} from '../components/shared';
import type { ColumnConfig } from '../components/shared';
import type { User } from '../types';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'segment_owner', label: 'Segment Owner' },
  { value: 'researcher', label: 'Researcher' },
  { value: 'approver', label: 'Approver' },
  { value: 'sdr', label: 'SDR' },
  { value: 'marketing', label: 'Marketing' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  segment_owner: 'bg-blue-100 text-blue-800 border-blue-200',
  researcher: 'bg-green-100 text-green-800 border-green-200',
  approver: 'bg-amber-100 text-amber-800 border-amber-200',
  sdr: 'bg-pink-100 text-pink-800 border-pink-200',
  marketing: 'bg-indigo-100 text-indigo-800 border-indigo-200',
};

function RoleBadge({ role }: { role: string }) {
  const colorClass = ROLE_COLORS[role] || 'bg-slate-100 text-slate-800 border-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {role.replace('_', ' ').toUpperCase()}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorClass = status === 'active'
    ? 'bg-green-100 text-green-800 border-green-200'
    : 'bg-slate-100 text-slate-800 border-slate-200';

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${colorClass}`}>
      {status.toUpperCase()}
    </span>
  );
}

export default function UserManagement() {
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const limit = 20;

  const { data, isLoading } = useUsers({
    skip,
    limit,
    search,
    role: roleFilter,
    status: statusFilter,
  });

  const { data: selectedUser, isLoading: isLoadingUser } = useUser(
    selectedUserId || ''
  );

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'role') {
      setRoleFilter(value);
      setSkip(0);
    } else if (key === 'status') {
      setStatusFilter(value);
      setSkip(0);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSkip(0);
  };

  const handleClearFilters = () => {
    setRoleFilter('all');
    setStatusFilter('all');
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const roles = formData.getAll('roles') as string[];

    await createUser.mutateAsync({
      email: formData.get('email') as string,
      name: formData.get('name') as string,
      password: formData.get('password') as string,
      roles,
    });

    setIsCreateModalOpen(false);
    e.currentTarget.reset();
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const formData = new FormData(e.currentTarget);
    const roles = formData.getAll('roles') as string[];

    await updateUser.mutateAsync({
      id: selectedUserId,
      data: {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        roles,
      },
    });

    setIsEditing(false);
  };

  const handleToggleStatus = async () => {
    if (!selectedUserId || !selectedUser) return;

    await updateUser.mutateAsync({
      id: selectedUserId,
      data: {
        status: selectedUser.status === 'active' ? 'deactivated' : 'active',
      },
    });
  };

  const columns: ColumnConfig<User>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (item) => (
        <div className="font-medium text-slate-900">{item.name}</div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '25%',
      render: (item) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Mail className="h-4 w-4 text-slate-400" />
          <span>{item.email}</span>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      width: '25%',
      render: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '15%',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '15%',
      render: (item) => (
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span>{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
        </div>
      ),
    },
  ];

  const filterConfigs = [
    {
      key: 'role',
      label: 'Role',
      options: ROLE_OPTIONS,
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'deactivated', label: 'Deactivated' },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage users and their roles in the system
              </p>
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        <div className="mb-6">
          <FilterBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name or email..."
            filters={filterConfigs}
            filterValues={{ role: roleFilter, status: statusFilter }}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        <DataTable<User>
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          emptyMessage="No users found. Add your first user to get started."
          onRowClick={(item) => {
            setSelectedUserId(item.id);
            setIsEditing(false);
          }}
        />

        {data && data.total > 0 && (
          <div className="mt-4">
            <Pagination
              total={data.total}
              skip={skip}
              limit={limit}
              onChange={setSkip}
            />
          </div>
        )}

        <SidePanel
          isOpen={!!selectedUserId}
          onClose={() => {
            setSelectedUserId(null);
            setIsEditing(false);
          }}
          title="User Details"
        >
          {isLoadingUser ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedUser ? (
            !isEditing ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">User Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Full Name
                      </label>
                      <p className="text-sm text-slate-900 font-medium">{selectedUser.name}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Email
                      </label>
                      <p className="text-sm text-slate-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Status
                      </label>
                      <StatusBadge status={selectedUser.status} />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Roles</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.roles.map((role) => (
                      <RoleBadge key={role} role={role} />
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Metadata</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Created</span>
                      <span className="text-slate-900 font-medium">
                        {format(new Date(selectedUser.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    onClick={handleToggleStatus}
                    disabled={updateUser.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedUser.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-150"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleUpdateUser} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={selectedUser.name}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    defaultValue={selectedUser.email}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Roles *
                  </label>
                  <div className="space-y-2">
                    {ROLE_OPTIONS.map((role) => (
                      <label key={role.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="roles"
                          value={role.value}
                          defaultChecked={selectedUser.roles.includes(role.value)}
                          className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="text-sm text-slate-700">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updateUser.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateUser.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateUser.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )
          ) : null}
        </SidePanel>

        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div className="fixed inset-0 bg-slate-900/50 transition-opacity" onClick={() => setIsCreateModalOpen(false)} />

              <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                  <h2 className="text-xl font-semibold text-slate-900">Create New User</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-slate-400 hover:text-slate-500 transition-colors duration-150"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateUser} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      minLength={8}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Roles *
                    </label>
                    <div className="space-y-2">
                      {ROLE_OPTIONS.map((role) => (
                        <label key={role.value} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            name="roles"
                            value={role.value}
                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-700">{role.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      disabled={createUser.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createUser.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {createUser.isPending ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

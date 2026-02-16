import { useState, useRef } from 'react';
import { Plus, Mail, Phone, Building2, User, Upload as UploadIcon, X, Linkedin } from 'lucide-react';
import { format } from 'date-fns';
import { useContacts, useContact, useCreateContact } from '../hooks/useContacts';
import { useSegments } from '../hooks/useSegments';
import { useCompanies } from '../hooks/useCompanies';
import {
  DataTable,
  FilterBar,
  SidePanel,
  Pagination,
  StatusBadge,
  LoadingSpinner,
  UploadModal,
} from '../components/shared';
import type { ColumnConfig } from '../components/shared';
import type { Contact } from '../types';

export default function Contacts() {
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [saveAndAddAnother, setSaveAndAddAnother] = useState(false);
  const createFormRef = useRef<HTMLFormElement>(null);

  const limit = 20;
  const createContact = useCreateContact();

  const { data, isLoading } = useContacts({
    skip,
    limit,
    search,
    segment_id: segmentFilter,
    status: statusFilter,
  });

  const { data: selectedContact, isLoading: isLoadingContact } = useContact(
    selectedContactId || ''
  );

  const { data: segmentsData } = useSegments({ limit: 100 });
  const { data: companiesData } = useCompanies({ limit: 100 });

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'segment') {
      setSegmentFilter(value);
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
    setSegmentFilter('all');
    setStatusFilter('all');
  };

  const getCompanyName = (companyId: string) => {
    const company = companiesData?.items.find((c) => c.id === companyId);
    return company?.company_name || 'Unknown Company';
  };

  const handleCreateContact = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const email = formData.get('email') as string;
    const company_id = formData.get('company_id') as string;
    const job_title = formData.get('job_title') as string;
    const linkedin_profile = formData.get('linkedin_profile') as string;

    try {
      await createContact.mutateAsync({
        first_name,
        last_name,
        email,
        company_id,
        job_title: job_title || undefined,
        contact_linkedin_url: linkedin_profile ? `https://linkedin.com/in/${linkedin_profile}` : undefined,
      });

      if (saveAndAddAnother) {
        // Reset form but keep modal open
        e.currentTarget.reset();
        setSaveAndAddAnother(false);
      } else {
        // Close modal and reset form
        setIsCreateModalOpen(false);
        e.currentTarget.reset();
      }
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const columns: ColumnConfig<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
            <User className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <div className="font-medium text-slate-900 dark:text-white">
              {item.first_name} {item.last_name}
            </div>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '20%',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
          <Mail className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <a
            href={`mailto:${item.email}`}
            className="text-primary-600 hover:text-primary-700 transition-colors duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {item.email}
          </a>
        </div>
      ),
    },
    {
      key: 'job_title',
      header: 'Job Title',
      width: '15%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
          {item.job_title || '—'}
        </div>
      ),
    },
    {
      key: 'company_id',
      header: 'Company',
      width: '15%',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
          <Building2 className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <span className="truncate max-w-[120px]">{getCompanyName(item.company_id)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '12%',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'assigned_sdr_id',
      header: 'SDR',
      width: '10%',
      render: (item) => (
        <span className="text-slate-600 dark:text-slate-400 text-sm">
          {item.assigned_sdr_id ? (
            <span className="font-medium">{item.assigned_sdr_id.slice(0, 8)}...</span>
          ) : (
            '—'
          )}
        </span>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '10%',
      sortable: true,
      render: (item) => (
        <span className="text-slate-600 dark:text-slate-400">
          {format(new Date(item.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const filterConfigs = [
    {
      key: 'segment',
      label: 'Segment',
      options:
        segmentsData?.items.map((s) => ({ value: s.id, label: s.name })) || [],
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'uploaded', label: 'Uploaded' },
        { value: 'approved', label: 'Approved' },
        { value: 'assigned_to_sdr', label: 'Assigned to SDR' },
        { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
      ],
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Contacts</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Manage contacts across all companies and segments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                <UploadIcon className="h-4 w-4" />
                Upload CSV
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150"
              >
                <Plus className="h-4 w-4" />
                Add Contact
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by name or email..."
            filters={filterConfigs}
            filterValues={{ segment: segmentFilter, status: statusFilter }}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table */}
        <DataTable<Contact>
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          emptyMessage="No contacts found. Add your first contact to get started."
          onRowClick={(item) => setSelectedContactId(item.id)}
        />

        {/* Pagination */}
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

        {/* Detail Side Panel */}
        <SidePanel
          isOpen={!!selectedContactId}
          onClose={() => setSelectedContactId(null)}
          title="Contact Details"
        >
          {isLoadingContact ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedContact ? (
            <div className="space-y-6">
              {/* Profile */}
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{selectedContact.job_title || 'No title'}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-2">Status</label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedContact.status} />
                  {selectedContact.is_duplicate && (
                    <span className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded border border-amber-200 dark:border-amber-700">
                      Duplicate
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Email</p>
                      <a
                        href={`mailto:${selectedContact.email}`}
                        className="text-sm text-primary-600 hover:text-primary-700 break-all"
                      >
                        {selectedContact.email}
                      </a>
                    </div>
                  </div>

                  {selectedContact.mobile_phone && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Mobile Phone</p>
                        <a
                          href={`tel:${selectedContact.mobile_phone}`}
                          className="text-sm text-slate-900 dark:text-white font-medium"
                        >
                          {selectedContact.mobile_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedContact.direct_phone_number && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Direct Phone</p>
                        <a
                          href={`tel:${selectedContact.direct_phone_number}`}
                          className="text-sm text-slate-900 dark:text-white font-medium"
                        >
                          {selectedContact.direct_phone_number}
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Company & Segment */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Organization</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Company</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {getCompanyName(selectedContact.company_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Segment</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {segmentsData?.items.find((s) => s.id === selectedContact.segment_id)?.name ||
                        'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              {selectedContact.assigned_sdr_id && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Assignment</h3>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">Assigned SDR</p>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {selectedContact.assigned_sdr_id}
                        </p>
                      </div>
                      <User className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Created</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {format(new Date(selectedContact.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {format(new Date(selectedContact.updated_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Created By</span>
                    <span className="text-slate-900 dark:text-white font-medium">{selectedContact.created_by_name || selectedContact.created_by}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150">
                    Assign to SDR
                  </button>
                  <button className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150">
                    Edit
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </SidePanel>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          uploadType="contact"
        />

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-slate-900/50 transition-opacity"
                onClick={() => setIsCreateModalOpen(false)}
              />
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full">
                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Add New Contact
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Enter the details below to manually create a new contact record.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary-600" />
                    </div>
                    <button
                      onClick={() => setIsCreateModalOpen(false)}
                      className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Form */}
                <form ref={createFormRef} onSubmit={handleCreateContact} className="p-6 space-y-6">
                  {/* Section 1: Personal Information */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-semibold">
                        1
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Personal Information
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* First Name & Last Name Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="first_name"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                          >
                            First Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="first_name"
                            name="first_name"
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g. Jane"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="last_name"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                          >
                            Last Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="last_name"
                            name="last_name"
                            required
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g. Doe"
                          />
                        </div>
                      </div>

                      {/* Email Address */}
                      <div>
                        <label
                          htmlFor="email"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            name="email"
                            required
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="jane.doe@example.com"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Professional Details */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary-600 text-white text-xs font-semibold">
                        2
                      </div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Professional Details
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {/* Company & Job Title Row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label
                            htmlFor="company_id"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                          >
                            Company <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                              <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                            </div>
                            <select
                              id="company_id"
                              name="company_id"
                              required
                              className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                            >
                              <option value="">Search company...</option>
                              {companiesData?.items.map((company) => (
                                <option key={company.id} value={company.id}>
                                  {company.company_name}
                                </option>
                              ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <svg className="h-4 w-4 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div>
                          <label
                            htmlFor="job_title"
                            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                          >
                            Job Title
                          </label>
                          <input
                            type="text"
                            id="job_title"
                            name="job_title"
                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g. Senior Marketing Manager"
                          />
                        </div>
                      </div>

                      {/* LinkedIn Profile */}
                      <div>
                        <label
                          htmlFor="linkedin_profile"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          LinkedIn Profile
                        </label>
                        <div className="flex items-center">
                          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-900/50 border border-r-0 border-slate-300 dark:border-slate-600 rounded-l-lg text-slate-600 dark:text-slate-400 text-sm">
                            <Linkedin className="h-4 w-4" />
                            <span>linkedin.com/in/</span>
                          </div>
                          <input
                            type="text"
                            id="linkedin_profile"
                            name="linkedin_profile"
                            className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-r-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="username"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Contact Module · Secure Form
                    </p>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsCreateModalOpen(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        onClick={() => setSaveAndAddAnother(true)}
                        disabled={createContact.isPending}
                        className="px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-white dark:bg-slate-700 border border-primary-600 dark:border-primary-400 rounded-lg hover:bg-primary-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Save & Add Another
                      </button>
                      <button
                        type="submit"
                        onClick={() => setSaveAndAddAnother(false)}
                        disabled={createContact.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {createContact.isPending ? 'Saving...' : 'Save Contact'}
                      </button>
                    </div>
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

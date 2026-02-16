import { useState } from 'react';
import { Plus, Mail, Phone, Building2, User, Upload as UploadIcon } from 'lucide-react';
import { format } from 'date-fns';
import { useContacts, useContact } from '../hooks/useContacts';
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

  const limit = 20;

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

  const columns: ColumnConfig<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-4 w-4 text-primary-600" />
          </div>
          <div>
            <div className="font-medium text-slate-900">
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
        <div className="flex items-center gap-1.5 text-slate-600">
          <Mail className="h-3.5 w-3.5 text-slate-400" />
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
        <div className="text-slate-600 truncate max-w-[150px]">
          {item.job_title || '—'}
        </div>
      ),
    },
    {
      key: 'company_id',
      header: 'Company',
      width: '15%',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-slate-900">
          <Building2 className="h-3.5 w-3.5 text-slate-400" />
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
        <span className="text-slate-600 text-sm">
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
        <span className="text-slate-600">
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
              <h1 className="text-2xl font-bold text-slate-900">Contacts</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage contacts across all companies and segments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-700 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors duration-150"
              >
                <UploadIcon className="h-4 w-4" />
                Upload CSV
              </button>
              <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150">
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
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedContact.first_name} {selectedContact.last_name}
                  </h3>
                  <p className="text-sm text-slate-600">{selectedContact.job_title || 'No title'}</p>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Status</label>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedContact.status} />
                  {selectedContact.is_duplicate && (
                    <span className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded border border-amber-200">
                      Duplicate
                    </span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Mail className="h-4 w-4 text-slate-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-400">Email</p>
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
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-400">Mobile Phone</p>
                        <a
                          href={`tel:${selectedContact.mobile_phone}`}
                          className="text-sm text-slate-900 font-medium"
                        >
                          {selectedContact.mobile_phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {selectedContact.direct_phone_number && (
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Phone className="h-4 w-4 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-400">Direct Phone</p>
                        <a
                          href={`tel:${selectedContact.direct_phone_number}`}
                          className="text-sm text-slate-900 font-medium"
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
                <h3 className="text-sm font-medium text-slate-500 mb-3">Organization</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Company</span>
                    <span className="text-slate-900 font-medium">
                      {getCompanyName(selectedContact.company_id)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Segment</span>
                    <span className="text-slate-900 font-medium">
                      {segmentsData?.items.find((s) => s.id === selectedContact.segment_id)?.name ||
                        'Unknown'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Assignment */}
              {selectedContact.assigned_sdr_id && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 mb-3">Assignment</h3>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-slate-400 mb-1">Assigned SDR</p>
                        <p className="text-sm font-medium text-slate-900">
                          {selectedContact.assigned_sdr_id}
                        </p>
                      </div>
                      <User className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created</span>
                    <span className="text-slate-900 font-medium">
                      {format(new Date(selectedContact.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Updated</span>
                    <span className="text-slate-900 font-medium">
                      {format(new Date(selectedContact.updated_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created By</span>
                    <span className="text-slate-900 font-medium">{selectedContact.created_by}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200">
                <div className="flex gap-3">
                  <button className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150">
                    Assign to SDR
                  </button>
                  <button className="flex-1 px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors duration-150">
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
      </div>
    </div>
  );
}

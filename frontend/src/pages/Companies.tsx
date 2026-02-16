import { useState } from 'react';
import { Plus, ExternalLink, MapPin, Users, Upload as UploadIcon, Package } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanies, useCompany } from '../hooks/useCompanies';
import { useSegments } from '../hooks/useSegments';
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
import type { CompanyWithContacts } from '../types';

export default function Companies() {
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const limit = 20;

  const { data, isLoading } = useCompanies({
    skip,
    limit,
    search,
    segment_id: segmentFilter,
    status: statusFilter,
  });

  const { data: selectedCompany, isLoading: isLoadingCompany } = useCompany(
    selectedCompanyId || ''
  );

  const { data: segmentsData } = useSegments({ limit: 100 });

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

  const columns: ColumnConfig<CompanyWithContacts>[] = [
    {
      key: 'company_name',
      header: 'Company Name',
      width: '20%',
      sortable: true,
      render: (item) => (
        <div className="font-medium text-slate-900">{item.company_name}</div>
      ),
    },
    {
      key: 'company_industry',
      header: 'Industry',
      width: '15%',
      render: (item) => (
        <div className="text-slate-600">{item.company_industry || '—'}</div>
      ),
    },
    {
      key: 'company_website',
      header: 'Website',
      width: '15%',
      render: (item) =>
        item.company_website ? (
          <a
            href={item.company_website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 transition-colors duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="truncate max-w-[150px]">{item.company_website}</span>
            <ExternalLink className="h-3 w-3 flex-shrink-0" />
          </a>
        ) : (
          <span className="text-slate-400">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'city',
      header: 'Location',
      width: '15%',
      render: (item) => {
        const location = [item.city, item.state_province, item.country_region]
          .filter(Boolean)
          .join(', ');
        return (
          <div className="flex items-center gap-1.5 text-slate-600">
            {location ? (
              <>
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="truncate max-w-[120px]">{location}</span>
              </>
            ) : (
              '—'
            )}
          </div>
        );
      },
    },
    {
      key: 'contact_count',
      header: 'Contacts',
      width: '10%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{item.contact_count}</span>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Created',
      width: '15%',
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
        { value: 'pending', label: 'Pending' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' },
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
              <h1 className="text-2xl font-bold text-slate-900">Companies</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage companies across all segments
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
                Add Company
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search by company name..."
            filters={filterConfigs}
            filterValues={{ segment: segmentFilter, status: statusFilter }}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table */}
        <DataTable<CompanyWithContacts>
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          emptyMessage="No companies found. Add your first company to get started."
          onRowClick={(item) => setSelectedCompanyId(item.id)}
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
          isOpen={!!selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
          title="Company Details"
        >
          {isLoadingCompany ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedCompany ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Company Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Company Name
                    </label>
                    <p className="text-sm text-slate-900 font-medium">{selectedCompany.company_name}</p>
                  </div>
                  {selectedCompany.company_description && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Description
                      </label>
                      <p className="text-sm text-slate-900">{selectedCompany.company_description}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Status
                    </label>
                    <StatusBadge status={selectedCompany.status} />
                  </div>
                  {selectedCompany.is_duplicate && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs font-medium text-amber-800">
                        This company is marked as a potential duplicate
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Website</span>
                    {selectedCompany.company_website ? (
                      <a
                        href={selectedCompany.company_website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-[200px]">{selectedCompany.company_website}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phone</span>
                    <span className="text-slate-900 font-medium">
                      {selectedCompany.company_phone || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">LinkedIn</span>
                    {selectedCompany.company_linkedin_url ? (
                      <a
                        href={selectedCompany.company_linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                      >
                        View Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Industry & Size */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Industry & Size</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Industry</span>
                    <span className="text-slate-900 font-medium">
                      {selectedCompany.company_industry || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Sub-Industry</span>
                    <span className="text-slate-900 font-medium">
                      {selectedCompany.company_sub_industry || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Employee Size</span>
                    <span className="text-slate-900 font-medium">
                      {selectedCompany.employee_size_range || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Revenue Range</span>
                    <span className="text-slate-900 font-medium">
                      {selectedCompany.revenue_range || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Founded</span>
                    <span className="text-slate-900 font-medium">
                      {selectedCompany.founded_year || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Location</h3>
                <div className="space-y-1 text-sm text-slate-900">
                  {selectedCompany.street && <p>{selectedCompany.street}</p>}
                  <p>
                    {[
                      selectedCompany.city,
                      selectedCompany.state_province,
                      selectedCompany.zip_postal_code,
                    ]
                      .filter(Boolean)
                      .join(', ') || '—'}
                  </p>
                  {selectedCompany.country_region && <p>{selectedCompany.country_region}</p>}
                </div>
              </div>

              {/* Stats */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Contacts</span>
                    </div>
                    <p className="text-xl font-semibold text-slate-900">
                      {selectedCompany.contact_count}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">Batch ID</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900 truncate">
                      {selectedCompany.batch_id || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created</span>
                    <span className="text-slate-900 font-medium">
                      {format(new Date(selectedCompany.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Updated</span>
                    <span className="text-slate-900 font-medium">
                      {format(new Date(selectedCompany.updated_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created By</span>
                    <span className="text-slate-900 font-medium">{selectedCompany.created_by}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SidePanel>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          uploadType="company"
          segmentId={segmentFilter !== 'all' ? segmentFilter : undefined}
        />
      </div>
    </div>
  );
}

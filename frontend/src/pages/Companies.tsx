import { useState } from 'react';
import { Plus, ExternalLink, MapPin, Users, Upload as UploadIcon, Package, X, Settings, Tag, Search, Phone, Linkedin, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useCompanies, useCompany, useCreateCompany, useUpdateCompany, useMarkCompanyDuplicate } from '../hooks/useCompanies';
import { useSegments } from '../hooks/useSegments';
import { useExportCompanies } from '../hooks/useExports';
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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formStreet, setFormStreet] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formZip, setFormZip] = useState('');

  const limit = 20;
  const createCompany = useCreateCompany();
  const updateCompany = useUpdateCompany();
  const markCompanyDuplicate = useMarkCompanyDuplicate();
  const exportCompanies = useExportCompanies();

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

  const handleCreateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const company_name = formData.get('company_name') as string;
    const segment_id = formData.get('segment_id') as string;
    const company_website = formData.get('company_website') as string;
    const company_phone = formData.get('company_phone') as string;
    const company_linkedin_url = formData.get('company_linkedin_url') as string;
    const company_industry = formData.get('company_industry') as string;
    const company_sub_industry = formData.get('company_sub_industry') as string;
    const employee_size_range = formData.get('employee_size_range') as string;
    const revenue_range = formData.get('revenue_range') as string;
    const founded_year_str = formData.get('founded_year') as string;

    try {
      await createCompany.mutateAsync({
        company_name,
        segment_id,
        company_website: company_website || undefined,
        company_phone: company_phone || undefined,
        company_linkedin_url: company_linkedin_url ? `https://linkedin.com/company/${company_linkedin_url}` : undefined,
        company_industry: company_industry || undefined,
        company_sub_industry: company_sub_industry || undefined,
        employee_size_range: employee_size_range || undefined,
        revenue_range: revenue_range || undefined,
        founded_year: founded_year_str ? parseInt(founded_year_str, 10) : undefined,
        street: formStreet || undefined,
        city: formCity || undefined,
        state_province: formState || undefined,
        country_region: formCountry || undefined,
        zip_postal_code: formZip || undefined,
      });
      setIsCreateModalOpen(false);
      setFormStreet('');
      setFormCity('');
      setFormState('');
      setFormCountry('');
      setFormZip('');
      e.currentTarget.reset();
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  const handleUpdateCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCompanyId) return;

    const formData = new FormData(e.currentTarget);
    const founded_year_str = formData.get('founded_year') as string;

    await updateCompany.mutateAsync({
      id: selectedCompanyId,
      data: {
        company_name: formData.get('company_name') as string,
        company_website: (formData.get('company_website') as string) || undefined,
        company_phone: (formData.get('company_phone') as string) || undefined,
        company_industry: (formData.get('company_industry') as string) || undefined,
        company_sub_industry: (formData.get('company_sub_industry') as string) || undefined,
        company_description: (formData.get('company_description') as string) || undefined,
        street: (formData.get('street') as string) || undefined,
        city: (formData.get('city') as string) || undefined,
        state_province: (formData.get('state_province') as string) || undefined,
        country_region: (formData.get('country_region') as string) || undefined,
        zip_postal_code: (formData.get('zip_postal_code') as string) || undefined,
        revenue_range: (formData.get('revenue_range') as string) || undefined,
        employee_size_range: (formData.get('employee_size_range') as string) || undefined,
        founded_year: founded_year_str ? parseInt(founded_year_str, 10) : undefined,
      },
    });
    setIsEditing(false);
  };

  const handleMarkDuplicate = async () => {
    if (!selectedCompanyId || !selectedCompany) return;
    await markCompanyDuplicate.mutateAsync({
      id: selectedCompanyId,
      is_duplicate: !selectedCompany.is_duplicate,
    });
  };

  const columns: ColumnConfig<CompanyWithContacts>[] = [
    {
      key: 'company_name',
      header: 'Company Name',
      width: '20%',
      sortable: true,
      render: (item) => (
        <div className="font-medium text-slate-900 dark:text-slate-100">{item.company_name}</div>
      ),
    },
    {
      key: 'company_industry',
      header: 'Industry',
      width: '15%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400">{item.company_industry || '—'}</div>
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
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Companies</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Manage companies across all segments
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportCompanies({ segment_id: segmentFilter !== 'all' ? segmentFilter : undefined, status: statusFilter !== 'all' ? statusFilter : undefined })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
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
          onClose={() => {
            setSelectedCompanyId(null);
            setIsEditing(false);
          }}
          title={isEditing ? 'Edit Company' : 'Company Details'}
        >
          {isLoadingCompany ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedCompany ? (
            !isEditing ? (
              <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Company Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Company Name
                    </label>
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">{selectedCompany.company_name}</p>
                  </div>
                  {selectedCompany.company_description && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Description
                      </label>
                      <p className="text-sm text-slate-900 dark:text-slate-100">{selectedCompany.company_description}</p>
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
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Contact Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Website</span>
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
                    <span className="text-slate-600 dark:text-slate-400">Phone</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
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
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Industry & Size</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Industry</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {selectedCompany.company_industry || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Sub-Industry</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {selectedCompany.company_sub_industry || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Employee Size</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {selectedCompany.employee_size_range || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Revenue Range</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {selectedCompany.revenue_range || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Founded</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {selectedCompany.founded_year || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Location</h3>
                <div className="space-y-1 text-sm text-slate-900 dark:text-slate-100">
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
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Statistics</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Contacts</span>
                    </div>
                    <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                      {selectedCompany.contact_count}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Batch ID</span>
                    </div>
                    <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                      {selectedCompany.batch_id || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Created</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {format(new Date(selectedCompany.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">
                      {format(new Date(selectedCompany.updated_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Created By</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">{selectedCompany.created_by_name || selectedCompany.created_by}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex-1 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleMarkDuplicate}
                    disabled={markCompanyDuplicate.isPending}
                    className="flex-1 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {selectedCompany.is_duplicate ? 'Unmark Duplicate' : 'Mark Duplicate'}
                  </button>
                </div>
              </div>
            </div>
            ) : (
              /* Edit Form */
              <form onSubmit={handleUpdateCompany} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="company_name"
                    defaultValue={selectedCompany.company_name}
                    required
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Website
                  </label>
                  <input
                    type="text"
                    name="company_website"
                    defaultValue={selectedCompany.company_website || ''}
                    placeholder="https://example.com"
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    name="company_phone"
                    defaultValue={selectedCompany.company_phone || ''}
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    name="company_industry"
                    defaultValue={selectedCompany.company_industry || ''}
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sub-Industry
                  </label>
                  <input
                    type="text"
                    name="company_sub_industry"
                    defaultValue={selectedCompany.company_sub_industry || ''}
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Description
                  </label>
                  <textarea
                    name="company_description"
                    defaultValue={selectedCompany.company_description || ''}
                    rows={3}
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Street Address
                  </label>
                  <input
                    type="text"
                    name="street"
                    defaultValue={selectedCompany.street || ''}
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      name="city"
                      defaultValue={selectedCompany.city || ''}
                      className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      State/Province
                    </label>
                    <input
                      type="text"
                      name="state_province"
                      defaultValue={selectedCompany.state_province || ''}
                      className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Country/Region
                    </label>
                    <input
                      type="text"
                      name="country_region"
                      defaultValue={selectedCompany.country_region || ''}
                      className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Zip/Postal Code
                    </label>
                    <input
                      type="text"
                      name="zip_postal_code"
                      defaultValue={selectedCompany.zip_postal_code || ''}
                      className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Revenue Range
                  </label>
                  <select
                    name="revenue_range"
                    defaultValue={selectedCompany.revenue_range || ''}
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select range</option>
                    <option value="< $1M">{"< $1M"}</option>
                    <option value="$1M - $10M">$1M - $10M</option>
                    <option value="$10M - $50M">$10M - $50M</option>
                    <option value="$50M - $100M">$50M - $100M</option>
                    <option value="$100M - $500M">$100M - $500M</option>
                    <option value="$500M - $1B">$500M - $1B</option>
                    <option value="> $1B">{"> $1B"}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Employee Size Range
                  </label>
                  <select
                    name="employee_size_range"
                    defaultValue={selectedCompany.employee_size_range || ''}
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select range</option>
                    <option value="1-10">1-10</option>
                    <option value="11-50">11-50</option>
                    <option value="51-200">51-200</option>
                    <option value="201-500">201-500</option>
                    <option value="501-1000">501-1000</option>
                    <option value="1001-5000">1001-5000</option>
                    <option value="5000+">5000+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    name="founded_year"
                    defaultValue={selectedCompany.founded_year || ''}
                    min="1800"
                    max="2100"
                    className="w-full px-3 py-2 border border-slate-300 dark:bg-slate-700 dark:border-slate-600 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={updateCompany.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateCompany.isPending}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateCompany.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )
          ) : null}
        </SidePanel>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          uploadType="company"
          segmentId={segmentFilter !== 'all' ? segmentFilter : undefined}
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
                <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                        Add New Company
                      </h2>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        Manually enter details to track a new organization in your CRM.
                      </p>
                      <div className="mt-3 h-1 w-16 bg-primary-600 rounded-full" />
                    </div>
                    <button
                      onClick={() => {
                        setIsCreateModalOpen(false);
                        setFormStreet('');
                        setFormCity('');
                        setFormState('');
                        setFormCountry('');
                        setFormZip('');
                      }}
                      className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400 transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <form onSubmit={handleCreateCompany} className="p-6 space-y-6">
                  {/* Section 1: Core Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Core Details
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Basic identification information
                    </p>

                    <div>
                      <label
                        htmlFor="segment_id"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                      >
                        Segment <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                        <select
                          id="segment_id"
                          name="segment_id"
                          required
                          className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none"
                        >
                          <option value="">Select a segment...</option>
                          {segmentsData?.items.map((segment) => (
                            <option key={segment.id} value={segment.id}>
                              {segment.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Every company must belong to a segment.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="company_name"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                      >
                        Company Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        id="company_name"
                        name="company_name"
                        required
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g. Acme Corp"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="company_website"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                      >
                        Website URL
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-sm">
                          https://
                        </span>
                        <input
                          type="text"
                          id="company_website"
                          name="company_website"
                          className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-r-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="www.example.com"
                        />
                      </div>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        We'll automatically fetch the logo based on the domain.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="company_phone"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Phone
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Phone className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <input
                            type="tel"
                            id="company_phone"
                            name="company_phone"
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div>
                        <label
                          htmlFor="company_linkedin_url"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          LinkedIn
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Linkedin className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <input
                            type="text"
                            id="company_linkedin_url"
                            name="company_linkedin_url"
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="linkedin.com/company/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Classification */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Classification
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Categorize the company for better segmentation.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="company_industry"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Industry
                        </label>
                        <select
                          id="company_industry"
                          name="company_industry"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select an industry</option>
                          <option value="Technology">Technology</option>
                          <option value="Healthcare">Healthcare</option>
                          <option value="Financial Services">Financial Services</option>
                          <option value="Manufacturing">Manufacturing</option>
                          <option value="Retail">Retail</option>
                          <option value="Education">Education</option>
                          <option value="Energy">Energy</option>
                          <option value="Media & Entertainment">Media & Entertainment</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Professional Services">Professional Services</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="company_sub_industry"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Sub-Industry
                        </label>
                        <input
                          type="text"
                          id="company_sub_industry"
                          name="company_sub_industry"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g. Cloud Computing"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label
                          htmlFor="employee_size_range"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Headcount
                        </label>
                        <select
                          id="employee_size_range"
                          name="employee_size_range"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select range</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-200">51-200</option>
                          <option value="201-500">201-500</option>
                          <option value="501-1000">501-1000</option>
                          <option value="1001-5000">1001-5000</option>
                          <option value="5000+">5000+</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="revenue_range"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Revenue Range
                        </label>
                        <select
                          id="revenue_range"
                          name="revenue_range"
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">Select range</option>
                          <option value="< $1M">{"< $1M"}</option>
                          <option value="$1M - $10M">$1M - $10M</option>
                          <option value="$10M - $50M">$10M - $50M</option>
                          <option value="$50M - $100M">$50M - $100M</option>
                          <option value="$100M - $500M">$100M - $500M</option>
                          <option value="$500M - $1B">$500M - $1B</option>
                          <option value="> $1B">{"> $1B"}</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="founded_year"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Founded Year
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                          </div>
                          <input
                            type="number"
                            id="founded_year"
                            name="founded_year"
                            min="1800"
                            max="2100"
                            className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="e.g. 2015"
                          />
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Section 3: Location */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                        Location
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Physical address of the company.
                    </p>

                    <div>
                      <label
                        htmlFor="create_street"
                        className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                      >
                        Street Address
                      </label>
                      <input
                        type="text"
                        id="create_street"
                        value={formStreet}
                        onChange={(e) => setFormStreet(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="e.g. 123 Main St"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="create_city"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          City
                        </label>
                        <input
                          type="text"
                          id="create_city"
                          value={formCity}
                          onChange={(e) => setFormCity(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g. San Francisco"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="create_state"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          State/Province
                        </label>
                        <input
                          type="text"
                          id="create_state"
                          value={formState}
                          onChange={(e) => setFormState(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g. CA"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="create_country"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Country/Region
                        </label>
                        <input
                          type="text"
                          id="create_country"
                          value={formCountry}
                          onChange={(e) => setFormCountry(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g. United States"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="create_zip"
                          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                        >
                          Zip/Postal Code
                        </label>
                        <input
                          type="text"
                          id="create_zip"
                          value={formZip}
                          onChange={(e) => setFormZip(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="e.g. 94105"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setFormStreet('');
                          setFormCity('');
                          setFormState('');
                          setFormCountry('');
                          setFormZip('');
                        }}
                        className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createCompany.isPending}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {createCompany.isPending ? 'Adding...' : 'Add Company'}
                      </button>
                    </div>
                    <p className="text-xs text-center text-slate-500 dark:text-slate-400">
                      Need to import multiple companies?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setIsUploadModalOpen(true);
                        }}
                        className="text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors"
                      >
                        Upload a CSV file
                      </button>{' '}
                      instead.
                    </p>
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

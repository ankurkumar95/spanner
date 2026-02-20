import { useState } from 'react';
import { format } from 'date-fns';
import { CheckCircle, XCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { useCompanies, useCompany, useApproveCompany, useRejectCompany } from '../hooks/useCompanies';
import { useContacts, useContact, useApproveContact } from '../hooks/useContacts';
import { useSegments } from '../hooks/useSegments';
import {
  DataTable,
  FilterBar,
  SidePanel,
  Pagination,
  StatusBadge,
  LoadingSpinner,
} from '../components/shared';
import type { ColumnConfig } from '../components/shared';
import type { CompanyWithContacts, Contact } from '../types';

type TabType = 'companies' | 'contacts';

export default function Approvals() {
  const [activeTab, setActiveTab] = useState<TabType>('companies');
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  const limit = 20;

  const { data: companiesData, isLoading: isLoadingCompanies } = useCompanies({
    skip,
    limit,
    search,
    status: 'pending',
  });

  const { data: contactsData, isLoading: isLoadingContacts } = useContacts({
    skip,
    limit,
    search,
    status: 'uploaded',
  });

  const { data: selectedCompany, isLoading: isLoadingCompany } = useCompany(
    activeTab === 'companies' && selectedId ? selectedId : ''
  );

  const { data: selectedContact, isLoading: isLoadingContact } = useContact(
    activeTab === 'contacts' && selectedId ? selectedId : ''
  );

  // Lookup data for table columns
  const { data: segmentsData } = useSegments({ limit: 100 });
  const { data: allCompaniesData } = useCompanies({ limit: 100 });

  const segmentNameMap = new Map(
    segmentsData?.items.map((s) => [s.id, s.name]) || []
  );
  const companyNameMap = new Map(
    allCompaniesData?.items.map((c) => [c.id, c.company_name]) || []
  );

  // Fetch parent company for selected contact to check approval status
  const { data: contactParentCompany } = useCompany(
    activeTab === 'contacts' && selectedContact ? selectedContact.company_id : ''
  );

  const isParentCompanyApproved = contactParentCompany?.status === 'approved';

  const approveCompany = useApproveCompany();
  const rejectCompany = useRejectCompany();
  const approveContact = useApproveContact();

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSkip(0);
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSkip(0);
    setSearch('');
    setSelectedId(null);
    setShowRejectForm(false);
    setRejectionReason('');
  };

  const handleApproveCompany = async () => {
    if (!selectedId) return;
    await approveCompany.mutateAsync(selectedId);
    setSelectedId(null);
  };

  const handleRejectCompany = async () => {
    if (!selectedId || !rejectionReason.trim()) return;
    await rejectCompany.mutateAsync({ id: selectedId, reason: rejectionReason });
    setSelectedId(null);
    setShowRejectForm(false);
    setRejectionReason('');
  };

  const handleApproveContact = async () => {
    if (!selectedId) return;
    await approveContact.mutateAsync(selectedId);
    setSelectedId(null);
  };

  const companyColumns: ColumnConfig<CompanyWithContacts>[] = [
    {
      key: 'company_name',
      header: 'Company Name',
      width: '25%',
      render: (item) => (
        <div className="font-medium text-slate-900 dark:text-white">{item.company_name}</div>
      ),
    },
    {
      key: 'segment_id',
      header: 'Segment',
      width: '20%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
          {segmentNameMap.get(item.segment_id) || '—'}
        </div>
      ),
    },
    {
      key: 'company_industry',
      header: 'Industry',
      width: '20%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400">{item.company_industry || '—'}</div>
      ),
    },
    {
      key: 'company_website',
      header: 'Website',
      width: '20%',
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
          <span className="text-slate-400 dark:text-slate-500">—</span>
        ),
    },
    {
      key: 'created_at',
      header: 'Uploaded',
      width: '15%',
      render: (item) => (
        <span className="text-slate-600 dark:text-slate-400">
          {format(new Date(item.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  const contactColumns: ColumnConfig<Contact>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '20%',
      render: (item) => (
        <div className="font-medium text-slate-900 dark:text-white">
          {item.first_name} {item.last_name}
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      width: '20%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400 truncate">{item.email}</div>
      ),
    },
    {
      key: 'company_id',
      header: 'Company',
      width: '20%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400 truncate max-w-[150px]">
          {companyNameMap.get(item.company_id) || '—'}
        </div>
      ),
    },
    {
      key: 'job_title',
      header: 'Job Title',
      width: '20%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400">{item.job_title || '—'}</div>
      ),
    },
    {
      key: 'created_at',
      header: 'Uploaded',
      width: '20%',
      render: (item) => (
        <span className="text-slate-600 dark:text-slate-400">
          {format(new Date(item.created_at), 'MMM d, yyyy')}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Approval Queue</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Review and approve pending companies and contacts
          </p>
        </div>

        <div className="mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <nav className="-mb-px flex gap-8">
              <button
                onClick={() => handleTabChange('companies')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                  activeTab === 'companies'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                Companies
                {companiesData && (
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {companiesData.total}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleTabChange('contacts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-150 ${
                  activeTab === 'contacts'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                Contacts
                {contactsData && (
                  <span className="ml-2 py-0.5 px-2 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                    {contactsData.total}
                  </span>
                )}
              </button>
            </nav>
          </div>
        </div>

        <div className="mb-6">
          <FilterBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder={`Search ${activeTab}...`}
            filters={[]}
            filterValues={{}}
            onFilterChange={() => {}}
            onClearFilters={() => {}}
          />
        </div>

        {activeTab === 'companies' ? (
          <DataTable<CompanyWithContacts>
            columns={companyColumns}
            data={companiesData?.items || []}
            loading={isLoadingCompanies}
            emptyMessage="No pending companies found."
            onRowClick={(item) => setSelectedId(item.id)}
          />
        ) : (
          <DataTable<Contact>
            columns={contactColumns}
            data={contactsData?.items || []}
            loading={isLoadingContacts}
            emptyMessage="No pending contacts found."
            onRowClick={(item) => setSelectedId(item.id)}
          />
        )}

        {activeTab === 'companies' && companiesData && companiesData.total > 0 && (
          <div className="mt-4">
            <Pagination
              total={companiesData.total}
              skip={skip}
              limit={limit}
              onChange={setSkip}
            />
          </div>
        )}

        {activeTab === 'contacts' && contactsData && contactsData.total > 0 && (
          <div className="mt-4">
            <Pagination
              total={contactsData.total}
              skip={skip}
              limit={limit}
              onChange={setSkip}
            />
          </div>
        )}

        <SidePanel
          isOpen={!!selectedId}
          onClose={() => {
            setSelectedId(null);
            setShowRejectForm(false);
            setRejectionReason('');
          }}
          title={activeTab === 'companies' ? 'Company Details' : 'Contact Details'}
        >
          {(activeTab === 'companies' ? isLoadingCompany : isLoadingContact) ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : activeTab === 'companies' && selectedCompany ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Company Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Company Name
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedCompany.company_name}</p>
                  </div>
                  {selectedCompany.company_description && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                        Description
                      </label>
                      <p className="text-sm text-slate-900 dark:text-white">{selectedCompany.company_description}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Status
                    </label>
                    <StatusBadge status={selectedCompany.status} />
                  </div>
                  {selectedCompany.approved_by_name && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                        Approved By
                      </label>
                      <p className="text-sm text-slate-900 dark:text-white">{selectedCompany.approved_by_name}</p>
                    </div>
                  )}
                  {selectedCompany.approved_at && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                        Approved At
                      </label>
                      <p className="text-sm text-slate-900 dark:text-white">
                        {format(new Date(selectedCompany.approved_at), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                  )}
                  {selectedCompany.is_duplicate && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                        This company is marked as a potential duplicate
                      </p>
                    </div>
                  )}
                </div>
              </div>

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
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">LinkedIn URL</span>
                    {selectedCompany.company_linkedin_url ? (
                      <a
                        href={selectedCompany.company_linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                      >
                        <span className="truncate max-w-[200px]">{selectedCompany.company_linkedin_url}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Phone</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedCompany.company_phone || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Industry & Size</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Industry</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedCompany.company_industry || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Employee Size</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedCompany.employee_size_range || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Revenue Range</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {selectedCompany.revenue_range || '—'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Location</h3>
                <div className="space-y-1 text-sm text-slate-900 dark:text-white">
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

              {!showRejectForm && (
                <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setShowRejectForm(true)}
                    disabled={approveCompany.isPending || rejectCompany.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button
                    onClick={handleApproveCompany}
                    disabled={approveCompany.isPending || rejectCompany.isPending}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                </div>
              )}

              {showRejectForm && (
                <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Rejection Reason *
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      placeholder="Please provide a reason for rejection..."
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowRejectForm(false);
                        setRejectionReason('');
                      }}
                      disabled={rejectCompany.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRejectCompany}
                      disabled={!rejectionReason.trim() || rejectCompany.isPending}
                      className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectCompany.isPending ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === 'contacts' && selectedContact ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Full Name
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white font-medium">
                      {selectedContact.first_name} {selectedContact.last_name}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Email
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white">{selectedContact.email}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Job Title
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white">{selectedContact.job_title || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Mobile Phone
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white">{selectedContact.mobile_phone || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Direct Phone
                    </label>
                    <p className="text-sm text-slate-900 dark:text-white">{selectedContact.direct_phone_number || '—'}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                      Status
                    </label>
                    <StatusBadge status={selectedContact.status} />
                  </div>
                  {selectedContact.is_duplicate && (
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                        This contact is marked as a potential duplicate
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Parent Company Status */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Company</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Company Name</span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {contactParentCompany?.company_name || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600 dark:text-slate-400">Company Status</span>
                    {contactParentCompany ? (
                      <StatusBadge status={contactParentCompany.status} />
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500">—</span>
                    )}
                  </div>
                </div>
              </div>

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
                    <span className="text-slate-600 dark:text-slate-400">Created By</span>
                    <span className="text-slate-900 dark:text-white font-medium">{selectedContact.created_by_name || selectedContact.created_by}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
                {!isParentCompanyApproved && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-400">
                      The parent company must be approved before this contact can be approved.
                    </p>
                  </div>
                )}
                <div className="flex justify-end">
                  <button
                    onClick={handleApproveContact}
                    disabled={approveContact.isPending || !isParentCompanyApproved}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle className="h-4 w-4" />
                    {approveContact.isPending ? 'Approving...' : 'Approve'}
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </SidePanel>
      </div>
    </div>
  );
}

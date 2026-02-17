import { useState } from 'react';
import { Plus, Building2, Users, AlertCircle, X, Check, Info, Search, Sparkles, Archive, Edit2, Save, Download } from 'lucide-react';
import { format } from 'date-fns';
import { useSegments, useSegment, useCreateSegment, useUpdateSegment, useArchiveSegment } from '../hooks/useSegments';
import { useSearchOfferings, useCreateOffering } from '../hooks/useOfferings';
import type { Offering } from '../hooks/useOfferings';
import { useExportSegments } from '../hooks/useExports';
import {
  DataTable,
  FilterBar,
  SidePanel,
  Pagination,
  StatusBadge,
  LoadingSpinner,
} from '../components/shared';
import type { ColumnConfig } from '../components/shared';
import type { SegmentWithStats } from '../types';

interface SelectedOffering extends Offering {
  isNew?: boolean;
}

export default function Segments() {
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [selectedOfferings, setSelectedOfferings] = useState<SelectedOffering[]>([]);
  const [offeringSearch, setOfferingSearch] = useState('');

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<'active' | 'archived'>('active');

  // Create offering confirmation popup state
  const [showCreateConfirm, setShowCreateConfirm] = useState(false);
  const [newOfferingName, setNewOfferingName] = useState('');
  const [newOfferingDescription, setNewOfferingDescription] = useState('');

  const limit = 20;
  const createSegment = useCreateSegment();
  const updateSegment = useUpdateSegment();
  const archiveSegment = useArchiveSegment();
  const exportSegments = useExportSegments();
  const createOffering = useCreateOffering();

  // Backend-searched offerings
  const { data: searchResults, isLoading: isSearchingOfferings } = useSearchOfferings(offeringSearch);

  const { data, isLoading } = useSegments({
    skip,
    limit,
    search,
    status: statusFilter,
  });

  const { data: selectedSegment, isLoading: isLoadingSegment } = useSegment(
    selectedSegmentId || ''
  );

  // Filter out already-selected offerings from search results
  const availableOfferings = (searchResults || []).filter(
    (o) => !selectedOfferings.some((s) => s.id === o.id)
  );

  // Check if exact match exists for "create new" tile
  const exactMatchExists = (searchResults || []).some(
    (o) => o.name.toLowerCase() === offeringSearch.trim().toLowerCase()
  );

  const handleAddOffering = (offering: Offering) => {
    setSelectedOfferings((prev) => [...prev, { ...offering, isNew: false }]);
    setOfferingSearch('');
  };

  const handleRemoveOffering = (id: string) => {
    setSelectedOfferings((prev) => prev.filter((o) => o.id !== id));
  };

  const handleCreateOfferingClick = () => {
    setNewOfferingName(offeringSearch.trim());
    setNewOfferingDescription('');
    setShowCreateConfirm(true);
  };

  const handleConfirmCreateOffering = async () => {
    try {
      const created = await createOffering.mutateAsync({
        name: newOfferingName,
        description: newOfferingDescription || undefined,
      });
      setSelectedOfferings((prev) => [...prev, { ...created, isNew: true }]);
      setShowCreateConfirm(false);
      setOfferingSearch('');
      setNewOfferingName('');
      setNewOfferingDescription('');
    } catch {
      // Error handled by mutation onError
    }
  };

  const resetCreateForm = () => {
    setFormName('');
    setFormDescription('');
    setFormIsActive(true);
    setSelectedOfferings([]);
    setOfferingSearch('');
    setShowCreateConfirm(false);
    setNewOfferingName('');
    setNewOfferingDescription('');
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    resetCreateForm();
  };

  const handleFilterChange = (key: string, value: string) => {
    if (key === 'status') {
      setStatusFilter(value);
      setSkip(0);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSkip(0);
  };

  const handleClearFilters = () => {
    setStatusFilter('all');
  };

  const handleCreateSegment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSegment.mutateAsync({
        name: formName,
        description: formDescription || undefined,
        offering_ids: selectedOfferings.map((o) => o.id),
      });
      handleCloseCreateModal();
    } catch {
      // Error handled by mutation onError
    }
  };

  const columns: ColumnConfig<SegmentWithStats>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '25%',
      sortable: true,
      render: (item) => (
        <div className="font-medium text-slate-900 dark:text-white">{item.name}</div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      width: '30%',
      render: (item) => (
        <div className="text-slate-600 dark:text-slate-400 truncate max-w-md">
          {item.description || '—'}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '10%',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'company_count',
      header: 'Companies',
      width: '10%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-slate-400 dark:text-slate-500" />
          <span className="font-medium">{item.company_count}</span>
          {item.pending_company_count > 0 && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              ({item.pending_company_count} pending)
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'contact_count',
      header: 'Contacts',
      width: '10%',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400 dark:text-slate-500" />
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

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Segments</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Manage your market segments and associated offerings
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => exportSegments()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-150"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150"
              >
                <Plus className="h-4 w-4" />
                Create Segment
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <FilterBar
            searchValue={search}
            onSearchChange={handleSearchChange}
            searchPlaceholder="Search segments by name..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                options: [
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ],
              },
            ]}
            filterValues={{ status: statusFilter }}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />
        </div>

        {/* Table */}
        <DataTable<SegmentWithStats>
          columns={columns}
          data={data?.items || []}
          loading={isLoading}
          emptyMessage="No segments found. Create your first segment to get started."
          onRowClick={(item) => setSelectedSegmentId(item.id)}
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
          isOpen={!!selectedSegmentId}
          onClose={() => {
            setSelectedSegmentId(null);
            setIsEditing(false);
          }}
          title={isEditing ? "Edit Segment" : "Segment Details"}
        >
          {isLoadingSegment ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedSegment ? (
            <>
              {!isEditing ? (
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Basic Information</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                          Name
                        </label>
                        <p className="text-sm text-slate-900 dark:text-white font-medium">{selectedSegment.name}</p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                          Description
                        </label>
                        <p className="text-sm text-slate-900 dark:text-white">
                          {selectedSegment.description || 'No description provided'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-400 dark:text-slate-500 mb-1">
                          Status
                        </label>
                        <StatusBadge status={selectedSegment.status} />
                      </div>
                    </div>
                  </div>

                  {/* Offerings */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Offerings</h3>
                    {selectedSegment.offerings.length > 0 ? (
                      <div className="space-y-2">
                        {selectedSegment.offerings.map((offering) => (
                          <div
                            key={offering.id}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                          >
                            <span className="text-sm font-medium text-slate-900 dark:text-white">
                              {offering.name}
                            </span>
                            <StatusBadge status={offering.status} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                        <AlertCircle className="h-4 w-4" />
                        No offerings associated with this segment
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">Metadata</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Created</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {format(new Date(selectedSegment.created_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Last Updated</span>
                        <span className="text-slate-900 dark:text-white font-medium">
                          {format(new Date(selectedSegment.updated_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Created By</span>
                        <span className="text-slate-900 dark:text-white font-medium">{selectedSegment.created_by_name || selectedSegment.created_by}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      onClick={() => {
                        setEditName(selectedSegment.name);
                        setEditDescription(selectedSegment.description || '');
                        setEditStatus(selectedSegment.status as 'active' | 'archived');
                        setIsEditing(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                    >
                      <Edit2 className="h-4 w-4" />
                      Edit
                    </button>
                    {selectedSegment.status === 'active' && (
                      <button
                        onClick={async () => {
                          try {
                            await archiveSegment.mutateAsync(selectedSegment.id);
                            setSelectedSegmentId(null);
                          } catch {
                            // Error handled by mutation
                          }
                        }}
                        disabled={archiveSegment.isPending}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {archiveSegment.isPending ? (
                          <>
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400 border-r-transparent" />
                            Archiving...
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4" />
                            Archive
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await updateSegment.mutateAsync({
                        id: selectedSegment.id,
                        data: {
                          name: editName,
                          description: editDescription || undefined,
                        },
                      });
                      setIsEditing(false);
                    } catch {
                      // Error handled by mutation
                    }
                  }}
                  className="space-y-6"
                >
                  {/* Edit Form */}
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="edit-name"
                        className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5"
                      >
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="edit-name"
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-description"
                        className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5"
                      >
                        Description
                      </label>
                      <textarea
                        id="edit-description"
                        rows={3}
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="edit-status"
                        className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5"
                      >
                        Status
                      </label>
                      <select
                        id="edit-status"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as 'active' | 'archived')}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      >
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updateSegment.isPending || !editName.trim()}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updateSegment.isPending ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </>
          ) : null}
        </SidePanel>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <div
                className="fixed inset-0 bg-slate-900/50 transition-opacity"
                onClick={handleCloseCreateModal}
              />
              <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                      Create New Segment
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                      Define a new audience segment for your ABM campaigns.
                    </p>
                  </div>
                  <button
                    onClick={handleCloseCreateModal}
                    className="text-slate-400 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateSegment} className="p-6 space-y-6">
                  {/* Segment Info */}
                  <div className="space-y-5">
                    {/* Segment Name */}
                    <div>
                      <label
                        htmlFor="segment-name"
                        className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5"
                      >
                        Segment Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="segment-name"
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="e.g., Q3 Enterprise Tech Targets"
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label
                        htmlFor="segment-description"
                        className="block text-sm font-medium text-slate-900 dark:text-white mb-1.5"
                      >
                        Description
                      </label>
                      <textarea
                        id="segment-description"
                        rows={3}
                        value={formDescription}
                        onChange={(e) => setFormDescription(e.target.value)}
                        placeholder="Briefly describe the target criteria, goals, or persona for this segment..."
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm resize-none"
                      />
                      <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                        Internal notes to help your team understand this segment's purpose.
                      </p>
                    </div>
                  </div>

                  {/* Configuration */}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                    <div className="mb-5">
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white">Configuration</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                        Associate products and set visibility.
                      </p>
                    </div>

                    {/* Associated Offerings */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">
                        Associated Offerings
                      </label>

                      {/* Selected Offerings Tiles */}
                      {selectedOfferings.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {selectedOfferings.map((offering) => (
                            <div
                              key={offering.id}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border cursor-default ${
                                offering.isNew
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : 'bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-300 border-primary-200 dark:border-primary-800'
                              }`}
                            >
                              {offering.isNew && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-200">
                                  <Sparkles className="h-2.5 w-2.5" />
                                  New
                                </span>
                              )}
                              {offering.name}
                              <button
                                type="button"
                                onClick={() => handleRemoveOffering(offering.id)}
                                className={`rounded-full p-0.5 transition-colors ${
                                  offering.isNew
                                    ? 'hover:bg-emerald-200 dark:hover:bg-emerald-800'
                                    : 'hover:bg-primary-200 dark:hover:bg-primary-800'
                                }`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Search Input */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                        <input
                          type="text"
                          value={offeringSearch}
                          onChange={(e) => setOfferingSearch(e.target.value)}
                          placeholder="Search or create offerings..."
                          className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                        />
                      </div>

                      {/* Search Results Tiles */}
                      <div className="mt-3">
                        {isSearchingOfferings ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-r-transparent" />
                            <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">Searching...</span>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {availableOfferings.map((offering) => (
                              <button
                                key={offering.id}
                                type="button"
                                onClick={() => handleAddOffering(offering)}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-300 transition-colors cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                {offering.name}
                              </button>
                            ))}

                            {/* Create New Offering Tile */}
                            {offeringSearch.trim() && !exactMatchExists && (
                              <button
                                type="button"
                                onClick={handleCreateOfferingClick}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors cursor-pointer"
                              >
                                <Sparkles className="h-3.5 w-3.5" />
                                Create "{offeringSearch.trim()}"
                              </button>
                            )}

                            {/* Empty state */}
                            {availableOfferings.length === 0 && !offeringSearch.trim() && (
                              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                                No offerings available. Type to search or create a new one.
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        Search to add existing offerings or create new ones on the fly.
                      </p>
                    </div>

                    {/* Create Offering Confirmation Popup */}
                    {showCreateConfirm && (
                      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <div
                          className="fixed inset-0 bg-slate-900/40"
                          onClick={() => setShowCreateConfirm(false)}
                        />
                        <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-sm w-full border border-slate-200 dark:border-slate-700">
                          <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                                <Sparkles className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              </div>
                              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                                Create New Offering
                              </h3>
                            </div>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                              This will create a new offering in your catalog and add it to this segment.
                            </p>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  Name
                                </label>
                                <input
                                  type="text"
                                  value={newOfferingName}
                                  onChange={(e) => setNewOfferingName(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                                  Description <span className="text-slate-400">(optional)</span>
                                </label>
                                <textarea
                                  rows={2}
                                  value={newOfferingDescription}
                                  onChange={(e) => setNewOfferingDescription(e.target.value)}
                                  placeholder="Brief description of this offering..."
                                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 rounded-b-lg">
                            <button
                              type="button"
                              onClick={() => setShowCreateConfirm(false)}
                              className="px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={!newOfferingName.trim() || createOffering.isPending}
                              onClick={handleConfirmCreateOffering}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {createOffering.isPending ? (
                                <>
                                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Create Offering
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Segment Status Toggle */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-medium text-slate-900 dark:text-white">
                            Segment Status
                          </label>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            Inactive segments are hidden from campaign builders.
                          </p>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={formIsActive}
                          onClick={() => setFormIsActive(!formIsActive)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formIsActive ? 'bg-primary-600' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formIsActive ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Pro Tip */}
                  <div className="flex gap-3 p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg">
                    <Info className="h-5 w-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-primary-900 dark:text-primary-300">Pro Tip</p>
                      <p className="text-sm text-primary-700 dark:text-primary-400 mt-0.5">
                        Segments with specific offering tags perform 24% better in ABM campaigns.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCloseCreateModal}
                      className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createSegment.isPending || !formName.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Check className="h-4 w-4" />
                      {createSegment.isPending ? 'Saving...' : 'Save Segment'}
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

import { useState } from 'react';
import { Plus, Building2, Users, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useSegments, useSegment } from '../hooks/useSegments';
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

export default function Segments() {
  const [skip, setSkip] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);

  const limit = 20;

  const { data, isLoading } = useSegments({
    skip,
    limit,
    search,
    status: statusFilter,
  });

  const { data: selectedSegment, isLoading: isLoadingSegment } = useSegment(
    selectedSegmentId || ''
  );

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

  const columns: ColumnConfig<SegmentWithStats>[] = [
    {
      key: 'name',
      header: 'Name',
      width: '25%',
      sortable: true,
      render: (item) => (
        <div className="font-medium text-slate-900">{item.name}</div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      width: '30%',
      render: (item) => (
        <div className="text-slate-600 truncate max-w-md">
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
          <Building2 className="h-4 w-4 text-slate-400" />
          <span className="font-medium">{item.company_count}</span>
          {item.pending_company_count > 0 && (
            <span className="text-xs text-amber-600">
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

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Segments</h1>
              <p className="mt-1 text-sm text-slate-600">
                Manage your market segments and associated offerings
              </p>
            </div>
            <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors duration-150">
              <Plus className="h-4 w-4" />
              Create Segment
            </button>
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
          onClose={() => setSelectedSegmentId(null)}
          title="Segment Details"
        >
          {isLoadingSegment ? (
            <div className="py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : selectedSegment ? (
            <div className="space-y-6">
              {/* Basic Info */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Basic Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Name
                    </label>
                    <p className="text-sm text-slate-900 font-medium">{selectedSegment.name}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Description
                    </label>
                    <p className="text-sm text-slate-900">
                      {selectedSegment.description || 'No description provided'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Status
                    </label>
                    <StatusBadge status={selectedSegment.status} />
                  </div>
                </div>
              </div>

              {/* Offerings */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Offerings</h3>
                {selectedSegment.offerings.length > 0 ? (
                  <div className="space-y-2">
                    {selectedSegment.offerings.map((offering) => (
                      <div
                        key={offering.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <span className="text-sm font-medium text-slate-900">
                          {offering.name}
                        </span>
                        <StatusBadge status={offering.status} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                    <AlertCircle className="h-4 w-4" />
                    No offerings associated with this segment
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-3">Metadata</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created</span>
                    <span className="text-slate-900 font-medium">
                      {format(new Date(selectedSegment.created_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Last Updated</span>
                    <span className="text-slate-900 font-medium">
                      {format(new Date(selectedSegment.updated_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Created By</span>
                    <span className="text-slate-900 font-medium">{selectedSegment.created_by}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </SidePanel>
      </div>
    </div>
  );
}

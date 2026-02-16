import { ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../../lib/utils';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { Database } from 'lucide-react';

export interface ColumnConfig<T> {
  key: string;
  header: string;
  width?: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: ColumnConfig<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  className,
}: DataTableProps<T>) {
  const handleSort = (column: ColumnConfig<T>) => {
    if (column.sortable && onSort) {
      onSort(column.key);
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg border border-slate-200 shadow-sm', className)}>
        <div className="p-12">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={cn('bg-white rounded-lg border border-slate-200 shadow-sm', className)}>
        <EmptyState icon={Database} title="No data found" description={emptyMessage} />
      </div>
    );
  }

  return (
    <div className={cn('bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  style={{ width: column.width }}
                  className={cn(
                    'px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider',
                    column.sortable && 'cursor-pointer select-none hover:bg-slate-100 transition-colors duration-150'
                  )}
                  onClick={() => column.sortable && handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {column.sortable && sortColumn === column.key && (
                      <span className="text-primary-600">
                        {sortDirection === 'asc' ? (
                          <ArrowUp className="h-4 w-4" />
                        ) : (
                          <ArrowDown className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {data.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'transition-colors duration-150',
                  onRowClick && 'cursor-pointer hover:bg-slate-50',
                  rowIndex % 2 === 1 && 'bg-slate-25'
                )}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-slate-900"
                  >
                    {column.render ? column.render(item) : ((item as any)[column.key] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

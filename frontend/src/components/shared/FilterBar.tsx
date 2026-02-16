import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface FilterConfig {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
}

interface FilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filters?: FilterConfig[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onClearFilters?: () => void;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  filterValues = {},
  onFilterChange,
  onClearFilters,
  className,
}: FilterBarProps) {
  const hasActiveFilters =
    searchValue.length > 0 ||
    Object.values(filterValues).some((value) => value !== '' && value !== 'all');

  const handleClear = () => {
    onSearchChange('');
    onClearFilters?.();
  };

  return (
    <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="relative flex-1 max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="block w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-2 pl-10 pr-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {filters.map((filter) => (
          <div key={filter.key} className="flex items-center gap-2">
            <label htmlFor={filter.key} className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {filter.label}:
            </label>
            <select
              id={filter.key}
              value={filterValues[filter.key] || 'all'}
              onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
              className="block rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 py-1.5 pl-3 pr-8 text-sm text-slate-900 dark:text-white focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            >
              <option value="all">All</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        ))}

        {hasActiveFilters && (
          <button
            onClick={handleClear}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors duration-150"
          >
            <X className="h-4 w-4" />
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

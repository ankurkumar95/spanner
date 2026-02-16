import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface PaginationProps {
  total: number;
  skip: number;
  limit: number;
  onChange: (skip: number) => void;
}

export function Pagination({ total, skip, limit, onChange }: PaginationProps) {
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  const from = total === 0 ? 0 : skip + 1;
  const to = Math.min(skip + limit, total);

  const canGoPrevious = skip > 0;
  const canGoNext = skip + limit < total;

  const handlePrevious = () => {
    if (canGoPrevious) {
      onChange(Math.max(0, skip - limit));
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      onChange(skip + limit);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      pages.push(totalPages);
    }

    return pages;
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 sm:px-6">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={handlePrevious}
          disabled={!canGoPrevious}
          className={cn(
            'relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
            canGoPrevious
              ? 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          )}
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={cn(
            'relative ml-3 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium',
            canGoNext
              ? 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-300'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
          )}
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Showing <span className="font-medium">{from}</span> to{' '}
            <span className="font-medium">{to}</span> of{' '}
            <span className="font-medium">{total}</span> results
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className={cn(
                'relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300',
                canGoPrevious
                  ? 'hover:bg-slate-50 focus:z-20 focus:outline-offset-0 cursor-pointer'
                  : 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {getPageNumbers().map((page, index) => {
              if (page === '...') {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-300"
                  >
                    ...
                  </span>
                );
              }

              const pageNumber = page as number;
              const isActive = pageNumber === currentPage;

              return (
                <button
                  key={pageNumber}
                  onClick={() => onChange((pageNumber - 1) * limit)}
                  className={cn(
                    'relative inline-flex items-center px-4 py-2 text-sm font-semibold ring-1 ring-inset ring-slate-300 focus:z-20 focus:outline-offset-0',
                    isActive
                      ? 'z-10 bg-primary-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600'
                      : 'text-slate-900 hover:bg-slate-50 cursor-pointer'
                  )}
                >
                  {pageNumber}
                </button>
              );
            })}
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className={cn(
                'relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300',
                canGoNext
                  ? 'hover:bg-slate-50 focus:z-20 focus:outline-offset-0 cursor-pointer'
                  : 'cursor-not-allowed opacity-50'
              )}
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

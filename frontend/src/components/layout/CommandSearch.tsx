import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, FileText, Building2, Users, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useDebounce } from '@/hooks/useDebounce';
import { api } from '@/lib/api';
import { Segment, Company, Contact, PaginatedResponse } from '@/types';

interface SearchResult {
  id: string;
  type: 'segment' | 'company' | 'contact' | 'page';
  title: string;
  subtitle?: string;
  path: string;
}

interface CommandSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

const pages: SearchResult[] = [
  {
    id: 'dashboard',
    type: 'page',
    title: 'Dashboard',
    path: '/',
  },
  {
    id: 'segments',
    type: 'page',
    title: 'Segments',
    path: '/segments',
  },
  {
    id: 'companies',
    type: 'page',
    title: 'Companies',
    path: '/companies',
  },
  {
    id: 'contacts',
    type: 'page',
    title: 'Contacts',
    path: '/contacts',
  },
  {
    id: 'approvals',
    type: 'page',
    title: 'Approval Queue',
    path: '/approvals',
  },
  {
    id: 'settings',
    type: 'page',
    title: 'Settings',
    path: '/settings',
  },
];

const typeIcons = {
  segment: FileText,
  company: Building2,
  contact: Users,
  page: LayoutDashboard,
};

export default function CommandSearch({ isOpen, onClose }: CommandSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const debouncedQuery = useDebounce(query, 300);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(pages);
      return;
    }

    setIsSearching(true);
    try {
      const [segmentsRes, companiesRes, contactsRes] = await Promise.all([
        api.get<PaginatedResponse<Segment>>('/segments', {
          params: { search: searchQuery, limit: 5 },
        }),
        api.get<PaginatedResponse<Company>>('/companies', {
          params: { search: searchQuery, limit: 5 },
        }),
        api.get<PaginatedResponse<Contact>>('/contacts', {
          params: { search: searchQuery, limit: 5 },
        }),
      ]);

      const searchResults: SearchResult[] = [];

      // Add segments
      segmentsRes.data.items.forEach((segment) => {
        searchResults.push({
          id: segment.id,
          type: 'segment',
          title: segment.name,
          subtitle: segment.description || undefined,
          path: `/segments?id=${segment.id}`,
        });
      });

      // Add companies
      companiesRes.data.items.forEach((company) => {
        searchResults.push({
          id: company.id,
          type: 'company',
          title: company.company_name,
          subtitle: company.company_website || undefined,
          path: `/companies?id=${company.id}`,
        });
      });

      // Add contacts
      contactsRes.data.items.forEach((contact) => {
        searchResults.push({
          id: contact.id,
          type: 'contact',
          title: `${contact.first_name} ${contact.last_name}`,
          subtitle: contact.email,
          path: `/contacts?id=${contact.id}`,
        });
      });

      // Filter pages by query
      const filteredPages = pages.filter((page) =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setResults([...searchResults, ...filteredPages]);
    } catch (error) {
      console.error('Search error:', error);
      setResults(pages);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Trigger search when debounced query changes
  useEffect(() => {
    if (isOpen) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery, isOpen, performSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % results.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onClose]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults(pages);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
  };

  if (!isOpen) return null;

  const groupedResults = results.reduce((acc, result) => {
    if (!acc[result.type]) {
      acc[result.type] = [];
    }
    acc[result.type].push(result);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4 pt-20">
        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-2xl border border-slate-200">
          {/* Search Input */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-200">
            <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search segments, companies, contacts, or pages..."
              className="flex-1 outline-none text-slate-900 placeholder:text-slate-400"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-200 px-2 py-1 text-xs font-medium text-slate-600">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-96 overflow-y-auto p-2">
            {isSearching ? (
              <div className="py-12 text-center">
                <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary-600 border-r-transparent"></div>
                <p className="mt-2 text-sm text-slate-600">Searching...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type}>
                    <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2 px-2">
                      {type === 'page' ? 'Pages' : `${type}s`}
                    </h3>
                    <div className="space-y-1">
                      {items.map((result) => {
                        const globalIndex = results.indexOf(result);
                        const Icon = typeIcons[result.type];
                        return (
                          <button
                            key={result.id}
                            onClick={() => handleSelect(result)}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                              selectedIndex === globalIndex
                                ? 'bg-primary-50 text-primary-900'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div
                              className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
                                selectedIndex === globalIndex
                                  ? 'bg-primary-100 text-primary-600'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-medium truncate">{result.title}</p>
                              {result.subtitle && (
                                <p className="text-xs text-slate-500 truncate">{result.subtitle}</p>
                              )}
                            </div>
                            <ArrowRight
                              className={`w-4 h-4 flex-shrink-0 ${
                                selectedIndex === globalIndex ? 'text-primary-600' : 'text-slate-400'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-600">No results found</p>
                <p className="text-xs text-slate-400 mt-1">Try a different search term</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50 text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">Enter</kbd>
                Select
              </span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-white">Esc</kbd>
              Close
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

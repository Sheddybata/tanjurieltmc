'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '@/lib/api';
import { formatCustomerOptionLabel } from '@/lib/member-id';

export interface CustomerSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  accounts?: { accountNumber: string; type?: string }[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CustomerSearchSelectProps {
  value: string;
  onChange: (customerId: string) => void;
  /** Base path, e.g. `/teller/customers` or `/manager/customers` */
  searchPath: string;
  label?: string;
  required?: boolean;
  /** Shown under the field when a customer is selected (e.g. after URL prefill) */
  selectedSummary?: string;
}

const PAGE_SIZE = 100;

export function CustomerSearchSelect({
  value,
  onChange,
  searchPath,
  label = 'Customer',
  required,
  selectedSummary,
}: CustomerSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CustomerSearchResult[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (searchQuery: string, pageNum: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          page: String(pageNum),
        });
        if (searchQuery.trim()) params.set('query', searchQuery.trim());
        const res = await api.get<{
          success: boolean;
          data: CustomerSearchResult[];
          meta: PaginationMeta;
        }>(`${searchPath}?${params.toString()}`);
        setMeta(res.meta);
        setResults((prev) => (append ? [...prev, ...(res.data ?? [])] : res.data ?? []));
        setPage(pageNum);
      } catch {
        if (!append) setResults([]);
        setMeta(null);
      } finally {
        setLoading(false);
      }
    },
    [searchPath],
  );

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      void fetchPage(query, 1, false);
    }, query.trim() ? 280 : 0);
    return () => clearTimeout(timer);
  }, [query, open, fetchPage]);

  useEffect(() => {
    if (!value) {
      setSelectedLabel('');
      return;
    }
    const inResults = results.find((c) => c.id === value);
    if (inResults) {
      setSelectedLabel(
        formatCustomerOptionLabel(inResults.firstName, inResults.lastName, inResults.accounts, inResults.phone),
      );
    } else if (selectedSummary) {
      setSelectedLabel(selectedSummary);
    }
  }, [value, results, selectedSummary]);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  function pick(customer: CustomerSearchResult) {
    onChange(customer.id);
    setSelectedLabel(
      formatCustomerOptionLabel(customer.firstName, customer.lastName, customer.accounts, customer.phone),
    );
    setQuery('');
    setOpen(false);
  }

  function clearSelection() {
    onChange('');
    setSelectedLabel('');
    setQuery('');
  }

  const canLoadMore = meta != null && meta.page < meta.totalPages;

  return (
    <div ref={containerRef} className="space-y-2">
      <label className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>

      {value && selectedLabel ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm">
          <span className="flex-1 text-emerald-900">{selectedLabel}</span>
          <button
            type="button"
            className="text-xs font-medium text-brand-600 hover:underline"
            onClick={clearSelection}
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              placeholder="Search name, phone, account number, BVN…"
              className="input-field w-full pl-10"
              autoComplete="off"
            />
          </div>
          <p className="text-xs text-gray-500">
            {open && !query.trim()
              ? 'Showing members — type to narrow the list'
              : 'Search or scroll the list to find any registered member'}
          </p>
        </>
      )}

      {open && !value && (
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          {loading && results.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-500">Loading members…</p>
          )}
          {!loading && results.length === 0 && (
            <p className="px-3 py-4 text-sm text-gray-500">No members match your search.</p>
          )}
          {results.length > 0 && (
            <ul className="max-h-64 overflow-y-auto divide-y divide-gray-50">
              {results.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-brand-50"
                    onClick={() => pick(c)}
                  >
                    <span className="font-medium text-gray-900">
                      {formatCustomerOptionLabel(c.firstName, c.lastName, c.accounts, c.phone)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {meta && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-xs text-gray-500">
              <span>
                {meta.total} member{meta.total === 1 ? '' : 's'}
                {query.trim() ? ' matching' : ' total'}
              </span>
              {canLoadMore && (
                <button
                  type="button"
                  className="font-medium text-brand-600 hover:underline disabled:opacity-50"
                  disabled={loading}
                  onClick={() => void fetchPage(query, page + 1, true)}
                >
                  {loading ? 'Loading…' : `Load more (${meta.total - results.length} remaining)`}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

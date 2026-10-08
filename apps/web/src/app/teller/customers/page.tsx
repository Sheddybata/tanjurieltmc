'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, UserPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { primaryMemberAccountNumber } from '@/lib/member-id';

/** API allows up to 100 rows per request (`paginate` in the backend). */
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
const DEFAULT_PAGE_SIZE = 50;

interface Customer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  kycStatus: string;
  createdAt: string;
  accounts: { accountNumber: string; type: string; balance: number }[];
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function CustomersPageContent() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setQuery(q);
    setPage(1);
    loadCustomers(q, 1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function loadCustomers(q: string, pageNum: number, limit: number) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        query: q,
        page: String(pageNum),
        limit: String(limit),
      });
      const res = await api.get<{
        success: boolean;
        data: Customer[];
        meta: PaginationMeta;
      }>(`/teller/customers?${params.toString()}`);
      setCustomers(res.data ?? []);
      setMeta(res.meta ?? null);
      setPage(pageNum);
    } catch {
      setCustomers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCustomers(query, 1, pageSize);
  }

  function goToPage(nextPage: number) {
    if (!meta) return;
    if (nextPage < 1 || nextPage > meta.totalPages) return;
    loadCustomers(query, nextPage, pageSize);
  }

  function handlePageSizeChange(next: number) {
    setPageSize(next);
    loadCustomers(query, 1, next);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      VERIFIED: 'badge-success',
      PENDING: 'badge-warning',
      REJECTED: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  };

  const limit = meta?.limit ?? pageSize;
  const total = meta?.total ?? 0;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(page * limit, total);

  return (
    <DashboardLayout>
      <Header
        title="Customers"
        subtitle={
          meta
            ? `${total.toLocaleString()} customer${total === 1 ? '' : 's'} registered`
            : 'Search and manage registered customers'
        }
      />
      <div className="p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearch} className="relative w-full max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, account number, BVN..."
              className="input-field pl-10"
            />
          </form>
          <Link href="/teller/customers/new">
            <Button><UserPlus className="h-4 w-4" /> Register Customer</Button>
          </Link>
        </div>
        <p className="-mt-4 mb-6 text-sm text-gray-500">
          Large member lists are split into pages. Search by name, phone, or account number to find someone quickly.
        </p>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-4">Account number</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Phone</th>
                  <th className="pb-3 pr-4">KYC</th>
                  <th className="pb-3 pr-4">Accounts</th>
                  <th className="pb-3">Registered</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">Loading...</td></tr>
                ) : customers.length === 0 ? (
                  <tr><td colSpan={6} className="py-8 text-center text-gray-400">No customers found</td></tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-3 pr-4 font-mono text-xs text-brand-600">
                        {primaryMemberAccountNumber(c.accounts)}
                      </td>
                      <td className="py-3 pr-4 font-medium">
                        <Link href={`/teller/customers/${c.id}`} className="hover:text-brand-600 hover:underline">
                          {c.firstName} {c.lastName}
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{c.phone}</td>
                      <td className="py-3 pr-4"><span className={statusBadge(c.kycStatus)}>{c.kycStatus}</span></td>
                      <td className="py-3 pr-4 text-gray-600">{c.accounts?.length || 0}</td>
                      <td className="py-3 text-gray-500">{formatDate(c.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 0 && (
            <div className="flex flex-col items-center justify-between gap-4 border-t border-gray-100 px-4 py-4 sm:flex-row">
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                <p>
                  Showing <span className="font-medium text-gray-900">{rangeStart}–{rangeEnd}</span> of{' '}
                  <span className="font-medium text-gray-900">{total.toLocaleString()}</span> customers
                </p>
                <label className="flex items-center gap-2">
                  <span className="text-gray-500">Per page</span>
                  <select
                    className="input-field w-auto py-1.5 text-sm"
                    value={pageSize}
                    disabled={loading}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  >
                    {PAGE_SIZE_OPTIONS.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={loading || page <= 1}
                  onClick={() => goToPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="min-w-[7rem] text-center text-sm text-gray-600">
                  Page {page} of {meta.totalPages}
                </span>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={loading || page >= meta.totalPages}
                  onClick={() => goToPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

export default function CustomersPage() {
  return (
    <Suspense
      fallback={
        <DashboardLayout>
          <Header title="Customers" subtitle="Search and manage registered customers" />
          <div className="p-8 text-center text-gray-400">Loading...</div>
        </DashboardLayout>
      }
    >
      <CustomersPageContent />
    </Suspense>
  );
}

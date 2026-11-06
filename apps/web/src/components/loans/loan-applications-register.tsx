'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/ui/page-shell';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { primaryMemberAccountNumber } from '@/lib/member-id';

const FILTER_TABS = [
  { id: '', label: 'All' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'UNDER_REVIEW', label: 'Under review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'DISBURSED', label: 'Disbursed' },
  { id: 'REJECTED', label: 'Rejected' },
];

const PAGE_SIZE = 50;

interface Loan {
  id: string;
  loanNumber: string;
  status: string;
  principalAmount: number;
  tenureMonths: number;
  monthlyPayment: number;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    accounts?: { accountNumber: string; type: string }[];
  };
  product: { name: string };
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

type Props = {
  /** e.g. `/manager/loans` */
  apiBasePath: string;
  /** e.g. `/manager/loans` for row links */
  detailHrefPrefix: string;
  sectionTitle: string;
  sectionDescription: string;
  newLoanHref: string;
  newLoanLabel: string;
};

export function LoanApplicationsRegister({
  apiBasePath,
  detailHrefPrefix,
  sectionTitle,
  sectionDescription,
  newLoanHref,
  newLoanLabel,
}: Props) {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    load();
  }, [filter, page, search]);

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter) params.set('status', filter);
      params.set('page', String(page));
      params.set('limit', String(PAGE_SIZE));
      if (search) params.set('search', search);
      const q = params.toString();
      const url = q ? `${apiBasePath}?${q}` : `${apiBasePath}?page=${page}&limit=${PAGE_SIZE}`;
      const res = await api.get<{ success: boolean; data: Loan[]; meta?: PaginationMeta }>(url, {
        noCache: true,
      });
      setLoans(Array.isArray(res.data) ? res.data : []);
      setMeta(
        res.meta ?? {
          page,
          limit: PAGE_SIZE,
          total: Array.isArray(res.data) ? res.data.length : 0,
          totalPages: 1,
        },
      );
    } catch {
      setLoans([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  function handleFilterChange(next: string) {
    setFilter(next);
    setPage(1);
  }

  const total = meta?.total ?? loans.length;
  const totalPages = meta?.totalPages ?? 1;
  const rangeStart = total === 0 ? 0 : (page - 1) * (meta?.limit ?? PAGE_SIZE) + 1;
  const rangeEnd = Math.min(page * (meta?.limit ?? PAGE_SIZE), total);

  return (
    <PageShell>
      <SectionHeading
        title={sectionTitle}
        description={sectionDescription}
        action={
          <Link
            href={newLoanHref}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            {newLoanLabel}
          </Link>
        }
      />

      <div className="mb-4 space-y-3">
        <FilterTabs tabs={FILTER_TABS} active={filter} onChange={handleFilterChange} />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-wrap items-end gap-2">
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="loan-search"
                placeholder="Search loan #, name, phone, account, product…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setSearchInput('')}>
              Clear search
            </Button>
          </div>
          <p className="text-sm text-gray-600 sm:shrink-0">
            {loading ? (
              'Loading…'
            ) : (
              <>
                Showing{' '}
                <span className="font-medium text-gray-900">
                  {rangeStart}–{rangeEnd}
                </span>{' '}
                of <span className="font-medium text-gray-900">{total}</span> application
                {total === 1 ? '' : 's'}
                {search ? ' (filtered)' : ''}
              </>
            )}
          </p>
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Customer</th>
                <th>Product</th>
                <th>Principal</th>
                <th>Monthly</th>
                <th>Tenure</th>
                <th>Status</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-400">
                    Loading applications...
                  </td>
                </tr>
              ) : loans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <EmptyState
                      icon={FileText}
                      title="No applications"
                      description={
                        search
                          ? 'No loans match your search. Try another term or clear the search.'
                          : 'No loan applications match this filter.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                loans.map((loan) => (
                  <tr key={loan.id}>
                    <td>
                      <Link
                        href={`${detailHrefPrefix}/${loan.id}`}
                        className="font-mono text-xs font-medium text-brand-700 hover:underline"
                      >
                        {loan.loanNumber}
                      </Link>
                    </td>
                    <td>
                      <p className="font-medium text-gray-900">
                        {loan.customer.firstName} {loan.customer.lastName}
                      </p>
                      <p className="text-xs font-mono text-gray-400">
                        {primaryMemberAccountNumber(loan.customer.accounts)}
                      </p>
                    </td>
                    <td className="text-gray-600">{loan.product.name}</td>
                    <td className="font-semibold text-gray-900">
                      {formatCurrency(Number(loan.principalAmount))}
                    </td>
                    <td className="text-gray-600">{formatCurrency(Number(loan.monthlyPayment))}</td>
                    <td className="text-gray-600">{loan.tenureMonths} mo</td>
                    <td>
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="text-gray-500">{formatDate(loan.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </PageShell>
  );
}

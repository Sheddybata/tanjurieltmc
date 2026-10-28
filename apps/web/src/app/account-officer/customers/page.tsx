'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface PortfolioCustomer {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  nextLoanDue?: {
    loanNumber: string;
    dueDate: string;
    totalDue: string | number;
    isOverdue: boolean;
  } | null;
}

export default function AccountOfficerCustomersPage() {
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<PortfolioCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (search.trim()) params.set('query', search.trim());
      const res = await api.get<{ success: boolean; data: PortfolioCustomer[] }>(
        `/account-officer/customers?${params.toString()}`,
      );
      setCustomers(res.data ?? []);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Could not load customers');
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <DashboardLayout>
      <Header title="My customers" subtitle="Members assigned to you" />
      <div className="p-8">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-end">
            <Input
              label="Search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, phone, or member ID"
              className="flex-1"
            />
            <Button type="button" onClick={() => setSearch(query)}>
              Search
            </Button>
          </div>
          {error && <div className="bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading…</p>
          ) : customers.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">No customers assigned to you yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Next loan payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3">
                        <Link href={`/account-officer/customers/${c.id}`} className="font-medium text-brand-600 hover:underline">
                          {c.firstName} {c.lastName}
                        </Link>
                        <p className="text-xs text-gray-500">{c.customerNumber}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{c.phone}</td>
                      <td className="px-4 py-3">
                        {c.nextLoanDue ? (
                          <span className={c.nextLoanDue.isOverdue ? 'text-red-700' : 'text-gray-800'}>
                            {formatDate(c.nextLoanDue.dueDate)} · {formatCurrency(Number(c.nextLoanDue.totalDue))}
                            {c.nextLoanDue.isOverdue && ' (overdue)'}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

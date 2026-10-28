'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

type Filter = 'all' | 'overdue' | 'week';

interface FollowUpRow {
  installmentNumber: number;
  dueDate: string;
  totalDue: string | number;
  isOverdue: boolean;
  loan: {
    loanNumber: string;
    customer: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
      customerNumber: string;
    };
  };
}

export function LoanFollowUpContent() {
  const searchParams = useSearchParams();
  const initialFilter = (searchParams.get('filter') as Filter) || 'all';
  const [filter, setFilter] = useState<Filter>(
    initialFilter === 'overdue' || initialFilter === 'week' ? initialFilter : 'all',
  );
  const [rows, setRows] = useState<FollowUpRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get<{ success: boolean; data: FollowUpRow[] }>(
        `/account-officer/loan-follow-up?filter=${filter}`,
      );
      setRows(res.data ?? []);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Could not load follow-up list');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <Header title="Loan follow-up" subtitle="Unpaid installments for your portfolio" />
      <div className="p-8">
        <Card className="overflow-hidden">
          <div className="border-b border-gray-100 p-4">
            <Select
              label="Show"
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              options={[
                { value: 'all', label: 'All unpaid installments' },
                { value: 'overdue', label: 'Overdue only' },
                { value: 'week', label: 'Due in the next 7 days' },
              ]}
            />
          </div>
          {error && <div className="bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          {loading ? (
            <p className="p-6 text-sm text-gray-500">Loading…</p>
          ) : rows.length === 0 ? (
            <p className="p-6 text-sm text-gray-500">Nothing to follow up for this filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 font-medium">Member</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Loan</th>
                    <th className="px-4 py-3 font-medium">Installment</th>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((row) => (
                    <tr key={`${row.loan.loanNumber}-${row.installmentNumber}`}>
                      <td className="px-4 py-3">
                        <Link
                          href={`/account-officer/customers/${row.loan.customer.id}`}
                          className="font-medium text-brand-600 hover:underline"
                        >
                          {row.loan.customer.firstName} {row.loan.customer.lastName}
                        </Link>
                      </td>
                      <td className="px-4 py-3">{row.loan.customer.phone}</td>
                      <td className="px-4 py-3">{row.loan.loanNumber}</td>
                      <td className="px-4 py-3">#{row.installmentNumber}</td>
                      <td className={`px-4 py-3 ${row.isOverdue ? 'font-medium text-red-700' : ''}`}>
                        {formatDate(row.dueDate)}
                      </td>
                      <td className="px-4 py-3">{formatCurrency(Number(row.totalDue))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FileText, Plus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/ui/page-shell';
import { FilterTabs } from '@/components/ui/filter-tabs';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { SectionHeading } from '@/components/ui/section-heading';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { primaryMemberAccountNumber } from '@/lib/member-id';

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

const FILTER_TABS = [
  { id: '', label: 'All' },
  { id: 'SUBMITTED', label: 'Submitted' },
  { id: 'UNDER_REVIEW', label: 'Under review' },
  { id: 'APPROVED', label: 'Approved' },
  { id: 'DISBURSED', label: 'Disbursed' },
  { id: 'REJECTED', label: 'Rejected' },
];

export default function TellerLoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLoans(filter);
  }, [filter]);

  async function loadLoans(status: string) {
    setLoading(true);
    try {
      const url = status ? `/teller/loans?status=${status}` : '/teller/loans';
      const res = await api.get<{ success: boolean; data: Loan[] }>(url);
      setLoans(Array.isArray(res.data) ? res.data : []);
    } catch {
      setLoans([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Loan applications"
        subtitle="Paper and walk-in applications you record here go to the manager approval queue"
      />
      <PageShell>
        <SectionHeading
          title="Application register"
          description="Tellers can record applications. Managers review, approve, and disburse."
          action={
            <Link
              href="/teller/loans/new"
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Record application
            </Link>
          }
        />

        <FilterTabs tabs={FILTER_TABS} active={filter} onChange={setFilter} />

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
                      <EmptyState icon={FileText} title="No applications" description="No loan applications match this filter." />
                    </td>
                  </tr>
                ) : (
                  loans.map((loan) => (
                    <tr key={loan.id}>
                      <td>
                        <Link href={`/teller/loans/${loan.id}`} className="font-mono text-xs font-medium text-brand-700 hover:underline">
                          {loan.loanNumber}
                        </Link>
                      </td>
                      <td>
                        <p className="font-medium text-gray-900">{loan.customer.firstName} {loan.customer.lastName}</p>
                        <p className="text-xs font-mono text-gray-400">
                          {primaryMemberAccountNumber(loan.customer.accounts)}
                        </p>
                      </td>
                      <td className="text-gray-600">{loan.product.name}</td>
                      <td className="font-semibold text-gray-900">{formatCurrency(Number(loan.principalAmount))}</td>
                      <td className="text-gray-600">{formatCurrency(Number(loan.monthlyPayment))}</td>
                      <td className="text-gray-600">{loan.tenureMonths} mo</td>
                      <td><StatusBadge status={loan.status} /></td>
                      <td className="text-gray-500">{formatDate(loan.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </PageShell>
    </DashboardLayout>
  );
}

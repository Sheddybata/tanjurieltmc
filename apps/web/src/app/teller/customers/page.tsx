'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, UserPlus } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

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

function CustomersPageContent() {
  const searchParams = useSearchParams();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('search') || '';
    setQuery(q);
    loadCustomers(q);
  }, [searchParams]);

  async function loadCustomers(q: string) {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: Customer[] }>(`/teller/customers?query=${encodeURIComponent(q)}`);
      setCustomers(res.data);
    } catch {
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCustomers(query);
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      VERIFIED: 'badge-success',
      PENDING: 'badge-warning',
      REJECTED: 'badge-danger',
    };
    return map[status] || 'badge-neutral';
  };

  return (
    <DashboardLayout>
      <Header title="Customers" subtitle="Search and manage registered customers" />
      <div className="p-8">
        <div className="mb-6 flex items-center justify-between">
          <form onSubmit={handleSearch} className="relative w-96">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone, BVN..."
              className="input-field pl-10"
            />
          </form>
          <Link href="/teller/customers/new">
            <Button><UserPlus className="h-4 w-4" /> Register Customer</Button>
          </Link>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-4">Customer #</th>
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
                      <td className="py-3 pr-4 font-mono text-xs text-brand-600">{c.customerNumber}</td>
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

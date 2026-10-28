'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface LoanScheduleRow {
  installmentNumber: number;
  dueDate: string;
  totalDue: string | number;
  paidAmount: string | number;
  isPaid: boolean;
}

interface CustomerDetail {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  alternatePhone?: string | null;
  email?: string | null;
  address: string;
  city: string;
  state: string;
  loans: {
    id: string;
    loanNumber: string;
    status: string;
    outstandingBalance: string | number;
    monthlyPayment: string | number;
    schedules: LoanScheduleRow[];
  }[];
}

export default function AccountOfficerCustomerDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get<{ success: boolean; data: CustomerDetail }>(`/account-officer/customers/${id}`)
      .then((res) => setCustomer(res.data))
      .catch((err: unknown) => {
        setError((err as { message?: string })?.message || 'Customer not found');
      });
  }, [id]);

  return (
    <DashboardLayout>
      <Header
        title={customer ? `${customer.firstName} ${customer.lastName}` : 'Member profile'}
        subtitle={customer?.customerNumber}
      />
      <div className="space-y-6 p-8">
        <Link href="/account-officer/customers" className="text-sm text-brand-600 hover:underline">
          ← Back to my customers
        </Link>
        {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        {customer && (
          <>
            <Card className="grid gap-4 p-6 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-gray-500">Phone</p>
                <p className="font-medium text-gray-900">{customer.phone}</p>
              </div>
              {customer.alternatePhone && (
                <div>
                  <p className="text-xs uppercase text-gray-500">Alternate phone</p>
                  <p className="font-medium text-gray-900">{customer.alternatePhone}</p>
                </div>
              )}
              {customer.email && (
                <div>
                  <p className="text-xs uppercase text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{customer.email}</p>
                </div>
              )}
              <div className="md:col-span-2">
                <p className="text-xs uppercase text-gray-500">Address</p>
                <p className="font-medium text-gray-900">
                  {customer.address}, {customer.city}, {customer.state}
                </p>
              </div>
            </Card>
            {customer.loans.length === 0 ? (
              <Card className="p-6 text-sm text-gray-500">No active loans for this member.</Card>
            ) : (
              customer.loans.map((loan) => (
                <Card key={loan.id} className="overflow-hidden">
                  <div className="border-b border-gray-100 bg-gray-50 px-6 py-4">
                    <p className="font-semibold text-gray-900">{loan.loanNumber}</p>
                    <p className="text-sm text-gray-600">
                      Outstanding {formatCurrency(Number(loan.outstandingBalance))} · Monthly{' '}
                      {formatCurrency(Number(loan.monthlyPayment))}
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="text-gray-600">
                        <tr>
                          <th className="px-6 py-3 font-medium">#</th>
                          <th className="px-6 py-3 font-medium">Due date</th>
                          <th className="px-6 py-3 font-medium">Amount</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {loan.schedules.map((row) => {
                          const overdue = !row.isPaid && new Date(row.dueDate) < new Date();
                          return (
                            <tr key={row.installmentNumber}>
                              <td className="px-6 py-3">{row.installmentNumber}</td>
                              <td className={`px-6 py-3 ${overdue ? 'text-red-700 font-medium' : ''}`}>
                                {formatDate(row.dueDate)}
                              </td>
                              <td className="px-6 py-3">{formatCurrency(Number(row.totalDue))}</td>
                              <td className="px-6 py-3">
                                {row.isPaid ? (
                                  <span className="text-emerald-700">Paid</span>
                                ) : overdue ? (
                                  <span className="text-red-700">Overdue</span>
                                ) : (
                                  <span className="text-gray-600">Upcoming</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              ))
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

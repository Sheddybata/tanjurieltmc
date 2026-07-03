'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface LoanProduct {
  id: string;
  code: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number;
  isActive: boolean;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<LoanProduct[]>([]);

  useEffect(() => {
    api.get<{ success: boolean; data: LoanProduct[] }>('/manager/loan-products')
      .then((res) => setProducts(res.data))
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <Header title="Loan Products" subtitle="Configure loan product catalog" />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-4">Code</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Min</th>
                  <th className="pb-3 pr-4">Max</th>
                  <th className="pb-3 pr-4">Rate</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-mono text-xs text-brand-600">{p.code}</td>
                    <td className="py-3 pr-4 font-medium">{p.name}</td>
                    <td className="py-3 pr-4">{formatCurrency(Number(p.minAmount))}</td>
                    <td className="py-3 pr-4">{formatCurrency(Number(p.maxAmount))}</td>
                    <td className="py-3 pr-4">{(Number(p.interestRate) * 100).toFixed(1)}%</td>
                    <td className="py-3"><span className={p.isActive ? 'badge-success' : 'badge-neutral'}>{p.isActive ? 'Active' : 'Inactive'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

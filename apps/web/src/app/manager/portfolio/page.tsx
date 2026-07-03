'use client';



import { useEffect, useState } from 'react';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

import { Header } from '@/components/layout/header';

import { StatCard } from '@/components/ui/stat-card';

import { Card } from '@/components/ui/card';

import { PageShell } from '@/components/ui/page-shell';

import { SectionHeading } from '@/components/ui/section-heading';

import { StatusBadge } from '@/components/ui/status-badge';

import { api } from '@/lib/api';

import { formatCurrency, formatPercent, formatNumber } from '@/lib/utils';

import { TrendingUp, DollarSign, AlertTriangle, Percent } from 'lucide-react';



interface Portfolio {

  totalOutstanding: number;

  totalDisbursed: number;

  par30: number;

  collectionRate: number;

  averageLoanSize: number;

  loansByStatus: Record<string, number>;

}



const COLORS = ['#2d8647', '#4da264', '#f97316', '#ef4444', '#6366f1', '#8b5cf6'];



export default function PortfolioPage() {

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    api

      .get<{ success: boolean; data: Portfolio }>('/manager/portfolio')

      .then((res) => setPortfolio(res.data))

      .catch(() => setPortfolio(null))

      .finally(() => setLoading(false));

  }, []);



  const chartData = portfolio

    ? Object.entries(portfolio.loansByStatus).map(([name, value]) => ({ name, value }))

    : [];



  const parRisk = (portfolio?.par30 || 0) > 0.05 ? 'negative' : 'neutral';



  return (

    <DashboardLayout>

      <Header title="Portfolio" subtitle="Loan book performance, risk indicators, and status breakdown" />

      <PageShell>

        {loading ? (

          <div className="flex h-40 items-center justify-center">

            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />

          </div>

        ) : (

          <>

            <section>

              <SectionHeading title="Key metrics" description="Snapshot of portfolio health" />

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <StatCard title="Outstanding" value={formatCurrency(portfolio?.totalOutstanding || 0)} icon={DollarSign} />

                <StatCard title="Total disbursed" value={formatCurrency(portfolio?.totalDisbursed || 0)} icon={TrendingUp} iconColor="bg-blue-100 text-blue-700" />

                <StatCard title="PAR 30" value={formatPercent(portfolio?.par30 || 0)} icon={AlertTriangle} iconColor="bg-amber-100 text-amber-700" changeType={parRisk} />

                <StatCard title="Collection rate" value={formatPercent(portfolio?.collectionRate || 0)} icon={Percent} iconColor="bg-emerald-100 text-emerald-700" changeType="positive" />

              </div>

            </section>



            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">

              <Card title="Loans by status" subtitle="Distribution across the pipeline">

                <div className="h-80">

                  {chartData.length > 0 ? (

                    <ResponsiveContainer width="100%" height="100%">

                      <PieChart>

                        <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={95} paddingAngle={2}>

                          {chartData.map((_, i) => (

                            <Cell key={i} fill={COLORS[i % COLORS.length]} />

                          ))}

                        </Pie>

                        <Tooltip />

                        <Legend />

                      </PieChart>

                    </ResponsiveContainer>

                  ) : (

                    <div className="flex h-full items-center justify-center text-sm text-gray-400">No loan data</div>

                  )}

                </div>

              </Card>



              <Card title="Status breakdown" subtitle="Count by stage">

                <div className="space-y-3">

                  <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-surface-secondary px-4 py-3">

                    <span className="text-sm text-gray-600">Average loan size</span>

                    <span className="font-display font-semibold text-gray-900">{formatCurrency(portfolio?.averageLoanSize || 0)}</span>

                  </div>

                  {chartData.map((item) => (

                    <div key={item.name} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0">

                      <StatusBadge status={item.name} />

                      <span className="font-medium text-gray-900">{formatNumber(item.value)}</span>

                    </div>

                  ))}

                </div>

              </Card>

            </div>

          </>

        )}

      </PageShell>

    </DashboardLayout>

  );

}


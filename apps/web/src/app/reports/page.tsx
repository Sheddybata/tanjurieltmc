'use client';



import { useEffect, useState } from 'react';

import { FileBarChart, Download } from 'lucide-react';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

import { Header } from '@/components/layout/header';

import { Card } from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import { Button } from '@/components/ui/button';

import { PageShell } from '@/components/ui/page-shell';

import { SectionHeading } from '@/components/ui/section-heading';

import { EmptyState } from '@/components/ui/empty-state';

import { api } from '@/lib/api';

import { formatCurrency } from '@/lib/utils';



export default function ReportsPage() {

  const [startDate, setStartDate] = useState('');

  const [endDate, setEndDate] = useState('');

  const [loading, setLoading] = useState(false);

  const [report, setReport] = useState<{ summary: { type: string; _sum: { amount: number }; _count: { id: number } }[] } | null>(null);



  useEffect(() => {

    const now = new Date();

    const monthAgo = new Date(now);

    monthAgo.setMonth(monthAgo.getMonth() - 1);

    setStartDate(monthAgo.toISOString().split('T')[0]);

    setEndDate(now.toISOString().split('T')[0]);

  }, []);



  async function generateReport() {

    if (!startDate || !endDate) return;

    setLoading(true);

    try {

      const res = await api.get<{ success: boolean; data: { summary: { type: string; _sum: { amount: number }; _count: { id: number } }[] } }>(

        `/reporting/transactions?startDate=${startDate}&endDate=${endDate}`,

      );

      setReport(res.data);

    } catch {

      setReport(null);

    } finally {

      setLoading(false);

    }

  }



  return (

    <DashboardLayout>

      <Header title="Reports" subtitle="Generate branch transaction summaries for a date range" />

      <PageShell>

        <Card title="Report parameters">

          <div className="flex flex-wrap items-end gap-4">

            <Input label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

            <Input label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

            <Button onClick={generateReport} loading={loading}>

              Generate report

            </Button>

          </div>

        </Card>



        {report ? (

          <section>

            <SectionHeading

              title="Transaction summary"

              description={`${startDate} to ${endDate}`}

              action={

                <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800">

                  <Download className="h-4 w-4" />

                  Export (coming soon)

                </button>

              }

            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {report.summary.map((s) => (

                <div key={s.type} className="rounded-xl border border-gray-100 bg-white p-5 shadow-card">

                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{s.type}</p>

                  <p className="mt-2 font-display text-2xl font-bold text-gray-900">{formatCurrency(Number(s._sum.amount || 0))}</p>

                  <p className="mt-1 text-sm text-gray-500">{s._count.id} transactions</p>

                </div>

              ))}

            </div>

          </section>

        ) : (

          !loading && (

            <EmptyState

              icon={FileBarChart}

              title="No report generated"

              description="Select a date range and click Generate report to view transaction totals."

            />

          )

        )}

      </PageShell>

    </DashboardLayout>

  );

}


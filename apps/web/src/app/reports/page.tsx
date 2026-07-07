'use client';

import { useEffect, useState } from 'react';
import { Download, BarChart3 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { PageShell } from '@/components/ui/page-shell';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { accountTypeLabel } from '@/lib/account-types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface ReportRow {
  date: string;
  reference: string;
  customerName: string;
  memberId: string;
  accountType: string;
  accountLabel?: string | null;
  type: string;
  amount: number;
  channel: string;
  status: string;
  branchName: string;
  processedBy?: string | null;
  narration?: string | null;
}

interface Branch {
  id: string;
  name: string;
  code: string;
}

const TX_TYPES = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'LOAN_DISBURSEMENT', 'LOAN_REPAYMENT', 'FEE', 'REVERSAL'];
const STATUSES = ['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REVERSED'];

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState('COMPLETED');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const now = new Date();
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    setStartDate(monthAgo.toISOString().split('T')[0]);
    setEndDate(now.toISOString().split('T')[0]);
    api.get<{ success: boolean; data: Branch[] }>('/reporting/branches')
      .then((res) => setBranches(res.data ?? []))
      .catch(() => setBranches([]));
  }, []);

  function queryString() {
    const params = new URLSearchParams({ startDate, endDate });
    if (branchId) params.set('branchId', branchId);
    if (type) params.set('type', type);
    if (status) params.set('status', status);
    return params.toString();
  }

  async function generateReport() {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: { rows: ReportRow[]; total: number } }>(
        `/reporting/transactions?${queryString()}`,
      );
      setRows(res.data.rows ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  async function exportPdf() {
    if (!startDate || !endDate) return;
    setExporting(true);
    try {
      await api.downloadPdf(`/reporting/transactions.pdf?${queryString()}`, `report-${startDate}-${endDate}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <DashboardLayout>
      <Header title="Reports" subtitle="Branch transaction activity with full detail" />
      <PageShell>
        <Card className="mb-6 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Input label="From" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="To" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <Select
              label="Branch"
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              options={[
                { value: '', label: 'All branches' },
                ...branches.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
            <Select
              label="Type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { value: '', label: 'All types' },
                ...TX_TYPES.map((t) => ({ value: t, label: t.replace(/_/g, ' ') })),
              ]}
            />
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <div className="flex items-end gap-2">
              <Button onClick={generateReport} loading={loading} className="flex-1">
                Run report
              </Button>
            </div>
          </div>
        </Card>

        {rows.length > 0 ? (
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <p className="text-sm text-gray-600">
                {rows.length} record{rows.length === 1 ? '' : 's'} · {formatDate(startDate)} – {formatDate(endDate)}
              </p>
              <Button variant="secondary" loading={exporting} onClick={exportPdf}>
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Reference</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Member ID</th>
                    <th className="px-4 py-3">Account</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3">Amount</th>
                    <th className="px-4 py-3">Channel</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Branch</th>
                    <th className="px-4 py-3">Staff</th>
                    <th className="px-4 py-3">Narration</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.reference}-${r.date}`} className="border-t border-gray-50">
                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">{r.date}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.reference}</td>
                      <td className="px-4 py-3">{r.customerName}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">{r.memberId}</td>
                      <td className="px-4 py-3">
                        {accountTypeLabel(r.accountType)}
                        {r.accountLabel ? ` · ${r.accountLabel}` : ''}
                      </td>
                      <td className="px-4 py-3">{r.type.replace(/_/g, ' ')}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{formatCurrency(r.amount)}</td>
                      <td className="px-4 py-3">{r.channel}</td>
                      <td className="px-4 py-3">
                        <span className={r.status === 'PENDING' ? 'text-amber-700' : r.status === 'COMPLETED' ? 'text-emerald-700' : ''}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">{r.branchName}</td>
                      <td className="px-4 py-3 text-gray-600">{r.processedBy || '—'}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-gray-500" title={r.narration ?? ''}>
                        {r.narration || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          !loading && (
            <EmptyState
              icon={BarChart3}
              title="No report loaded"
              description="Set your filters and click Run report to view transaction detail."
            />
          )
        )}
      </PageShell>
    </DashboardLayout>
  );
}

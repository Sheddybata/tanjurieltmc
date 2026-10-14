'use client';

import { useEffect, useState, FormEvent } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

interface LoanRepricePreview {
  total: number;
  legacyInterestCount: number;
  sample: {
    loanNumber: string;
    status: string;
    principalAmount: number;
    flatInterestAmount: number | null;
    customerName: string;
  }[];
}

interface BulkResult {
  updated: number;
  skipped: number;
  failed: number;
  flatInterestRate: number;
  updatedLoans: { loanNumber: string; name: string; newInterest: number }[];
  failures: { loanNumber: string; error: string }[];
}

export default function AdminLoanPricingPage() {
  const [ratePercent, setRatePercent] = useState('3');
  const [platformRate, setPlatformRate] = useState<number | null>(null);
  const [loanNumber, setLoanNumber] = useState('');
  const [singleRatePercent, setSingleRatePercent] = useState('3');
  const [applyToAll, setApplyToAll] = useState(false);
  const [forceRecalc, setForceRecalc] = useState(false);
  const [preview, setPreview] = useState<LoanRepricePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [bulkRunning, setBulkRunning] = useState(false);
  const [singleRunning, setSingleRunning] = useState(false);
  const [bulkResult, setBulkResult] = useState<BulkResult | null>(null);

  useEffect(() => {
    loadPlatformRate();
    loadPreview();
  }, []);

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applyToAll]);

  async function loadPlatformRate() {
    try {
      const res = await api.get<{ success: boolean; data: { flatInterestRate: number } }>(
        '/settings/loan-pricing',
      );
      const rate = res.data.flatInterestRate;
      setPlatformRate(rate);
      const pct = String(Math.round(rate * 1000) / 10);
      setRatePercent(pct);
      setSingleRatePercent(pct);
    } catch {
      setPlatformRate(null);
    }
  }

  async function loadPreview() {
    setPreviewLoading(true);
    try {
      const q = applyToAll ? '?scope=all' : '';
      const res = await api.get<{ success: boolean; data: LoanRepricePreview }>(
        `/settings/loans/interest-reprice-preview${q}`,
      );
      setPreview(res.data);
    } catch {
      setPreview(null);
    } finally {
      setPreviewLoading(false);
    }
  }

  function parseRatePercent(value: string): number | null {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0 || n > 100) return null;
    return Math.round(n * 100) / 10000;
  }

  async function savePlatformRate(e: FormEvent) {
    e.preventDefault();
    const rate = parseRatePercent(ratePercent);
    if (rate == null) {
      setMessage('Enter a valid interest rate between 0 and 100');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api.put('/settings/loan-pricing', { flatInterestRate: rate });
      setPlatformRate(rate);
      setMessage(`Default rate for new applications set to ${(rate * 100).toFixed(1)}%`);
      await loadPreview();
    } catch {
      setMessage('Could not save platform rate');
    } finally {
      setSaving(false);
    }
  }

  async function runBulk() {
    const rate = parseRatePercent(ratePercent);
    if (rate == null) return;
    const label = applyToAll ? 'ALL active loans (including disbursed)' : 'submitted/approved loans without repayments';
    const ok = window.confirm(
      `Recalculate interest at ${(rate * 100).toFixed(1)}% for ${label}? Paid installments are kept; unpaid schedules are rebuilt.`,
    );
    if (!ok) return;
    setBulkRunning(true);
    setBulkResult(null);
    setMessage('');
    try {
      const res = await api.post<{ success: boolean; data: BulkResult }>(
        '/settings/loans/recalculate-interest',
        {
          flatInterestRate: rate,
          applyToAllLoans: applyToAll,
          force: forceRecalc,
        },
      );
      setBulkResult(res.data);
      setMessage(
        `Bulk update: ${res.data.updated} updated, ${res.data.skipped} skipped, ${res.data.failed} failed.`,
      );
      await loadPreview();
    } catch {
      setMessage('Bulk recalculation failed');
    } finally {
      setBulkRunning(false);
    }
  }

  async function runSingle(e: FormEvent) {
    e.preventDefault();
    const rate = parseRatePercent(singleRatePercent);
    if (rate == null || !loanNumber.trim()) {
      setMessage('Enter loan number and a valid rate');
      return;
    }
    setSingleRunning(true);
    setMessage('');
    try {
      const res = await api.post<{
        success: boolean;
        data: {
          loanNumber: string;
          customerName: string;
          flatInterestAmount: number;
          totalRepayable: number;
        };
      }>('/settings/loans/recalculate-one', {
        loanNumber: loanNumber.trim(),
        flatInterestRate: rate,
      });
      setMessage(
        `Updated ${res.data.loanNumber} (${res.data.customerName}): interest ₦${res.data.flatInterestAmount.toLocaleString()}, total repayable ₦${res.data.totalRepayable.toLocaleString()}`,
      );
      setLoanNumber('');
      await loadPreview();
    } catch (err: unknown) {
      setMessage((err as { message?: string })?.message || 'Single loan update failed');
    } finally {
      setSingleRunning(false);
    }
  }

  return (
    <DashboardLayout>
      <Header
        title="Loan interest"
        subtitle="Default rate for new applications and admin repricing of existing loans"
      />
      <div className="space-y-6 p-8">
        <p className="text-sm text-gray-500">
          <Link href="/admin/settings" className="text-brand-600 hover:underline">
            ← Back to settings
          </Link>
        </p>
        {message && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>
        )}

        <Card title="Default rate (new applications)">
          <p className="mb-4 text-sm text-gray-500">
            Used for new loan quotes and applications after save. Current:{' '}
            {platformRate != null ? `${(platformRate * 100).toFixed(1)}% flat on principal` : '…'}
          </p>
          <form onSubmit={savePlatformRate} className="flex max-w-xs flex-wrap items-end gap-3">
            <Input
              label="Interest rate (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={ratePercent}
              onChange={(e) => setRatePercent(e.target.value)}
              required
            />
            <Button type="submit" loading={saving}>
              Save default
            </Button>
          </form>
        </Card>

        <Card title="Single loan">
          <p className="mb-4 text-sm text-gray-500">
            Enter the loan number (e.g. LN…) to recalculate interest and schedules for that record only.
          </p>
          <form onSubmit={runSingle} className="grid max-w-lg gap-4 sm:grid-cols-2">
            <Input
              label="Loan number"
              value={loanNumber}
              onChange={(e) => setLoanNumber(e.target.value)}
              placeholder="LN…"
              required
            />
            <Input
              label="Interest rate (%)"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={singleRatePercent}
              onChange={(e) => setSingleRatePercent(e.target.value)}
              required
            />
            <div className="sm:col-span-2">
              <Button type="submit" loading={singleRunning}>
                Update this loan
              </Button>
            </div>
          </form>
        </Card>

        <Card title="Bulk update existing loans">
          <p className="mb-4 text-sm text-gray-500">
            Recalculates stored interest, totals, and unpaid installments. Loans with repayments keep paid rows;
            outstanding balance is adjusted. Closed and rejected loans are excluded.
          </p>
          <label className="mb-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} />
            Include disbursed / active loans (not only pre-disbursement)
          </label>
          <label className="mb-4 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={forceRecalc} onChange={(e) => setForceRecalc(e.target.checked)} />
            Force update even if already at target rate
          </label>
          {previewLoading ? (
            <p className="text-sm text-gray-400">Loading preview…</p>
          ) : preview ? (
            <p className="mb-4 text-sm text-gray-700">
              Eligible: <strong>{preview.total}</strong> · Not yet at target rate:{' '}
              <strong>{preview.legacyInterestCount}</strong>
            </p>
          ) : null}
          <Button type="button" loading={bulkRunning} onClick={runBulk}>
            Run bulk recalculation
          </Button>
          {bulkResult && bulkResult.failures.length > 0 && (
            <ul className="mt-4 list-disc pl-5 text-sm text-amber-900">
              {bulkResult.failures.slice(0, 6).map((f) => (
                <li key={f.loanNumber}>
                  {f.loanNumber}: {f.error}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

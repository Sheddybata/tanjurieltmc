'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MetricTile } from '@/components/ui/metric-tile';
import { PageShell } from '@/components/ui/page-shell';
import { SectionHeading } from '@/components/ui/section-heading';
import { EmptyState } from '@/components/ui/empty-state';
import { api } from '@/lib/api';
import { cn, formatCurrency } from '@/lib/utils';

interface Reconciliation {
  totalCustomerBalances: number;
  totalHeldBalances: number;
  pendingDepositCount: number;
  pendingDepositAmount: number;
  pendingOutboundCount: number;
  pendingOutboundAmount: number;
  settlementAccounts: Array<{
    provider: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    isActive: boolean;
  }>;
  note: string;
}

const STORAGE_KEY = 'tanjuriel_bank_balances';

function parseAmount(value: string): number {
  const n = parseFloat(value.replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export default function ReconciliationPage() {
  const [data, setData] = useState<Reconciliation | null>(null);
  const [loading, setLoading] = useState(true);
  const [bankBalances, setBankBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setBankBalances(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    api
      .get<{ success: boolean; data: Reconciliation }>('/operations/reconciliation')
      .then((res) => {
        const payload = res.data;
        if (payload && Array.isArray(payload.settlementAccounts)) {
          setData(payload);
        } else {
          setData(null);
        }
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  function updateBalance(provider: string, value: string) {
    setBankBalances((prev) => {
      const next = { ...prev, [provider]: value };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  const actualBankTotal = useMemo(() => {
    if (!data) return 0;
    return data.settlementAccounts.reduce((sum, acct) => sum + parseAmount(bankBalances[acct.provider] || ''), 0);
  }, [data, bankBalances]);

  const expectedInBank = useMemo(() => {
    if (!data) return 0;
    // Deposits received in bank but not yet credited increase expected bank balance
    return data.totalCustomerBalances + data.pendingDepositAmount;
  }, [data]);

  const variance = actualBankTotal - expectedInBank;
  const hasBankInput = actualBankTotal > 0;
  const isBalanced = hasBankInput && Math.abs(variance) < 1;
  const isShort = hasBankInput && variance < -1;
  const isSurplus = hasBankInput && variance > 1;

  return (
    <DashboardLayout>
      <Header title="Reconciliation" />
      <PageShell>
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
          </div>
        ) : !data ? (
          <EmptyState
            icon={AlertCircle}
            title="Reconciliation unavailable"
            description="Could not load ledger and settlement data. Check your connection and try again."
          />
        ) : (
          <>
            <div
              className={cn(
                'rounded-xl border px-5 py-4',
                !hasBankInput && 'border-brand-100 bg-brand-50/60 text-brand-900',
                isBalanced && 'border-emerald-200 bg-emerald-50 text-emerald-950',
                isShort && 'border-red-200 bg-red-50 text-red-950',
                isSurplus && 'border-amber-200 bg-amber-50 text-amber-950',
              )}
            >
              <div className="flex items-start gap-3">
                {!hasBankInput ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
                ) : isBalanced ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                )}
                <div className="flex-1">
                  <p className="font-display font-semibold">
                    {!hasBankInput
                      ? 'Enter bank balances to check variance'
                      : isBalanced
                        ? 'Ledger and banks are reconciled'
                        : isShort
                          ? 'Shortfall detected — investigate before end of day'
                          : 'Surplus in bank — verify pending deposits'}
                  </p>
                  <p className="mt-1 text-sm opacity-80">{data.note}</p>
                </div>
              </div>

              {hasBankInput && (
                <div className="mt-4 grid gap-3 border-t border-black/5 pt-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70">Expected in banks</p>
                    <p className="mt-1 font-display text-lg font-bold">{formatCurrency(expectedInBank)}</p>
                    <p className="text-xs opacity-60">Ledger + pending deposits</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70">Actual (your entry)</p>
                    <p className="mt-1 font-display text-lg font-bold">{formatCurrency(actualBankTotal)}</p>
                    <p className="text-xs opacity-60">Sum of settlement accounts</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide opacity-70">Variance (Δ)</p>
                    <p
                      className={cn(
                        'mt-1 font-display text-lg font-bold',
                        isBalanced && 'text-emerald-700',
                        isShort && 'text-red-700',
                        isSurplus && 'text-amber-700',
                      )}
                    >
                      {variance >= 0 ? '+' : ''}
                      {formatCurrency(variance)}
                    </p>
                    <p className="text-xs opacity-60">Actual minus expected</p>
                  </div>
                </div>
              )}
            </div>

            <section>
              <SectionHeading title="Ledger summary" description="Internal balances on the platform" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricTile label="Customer balances" value={formatCurrency(data.totalCustomerBalances)} />
                <MetricTile label="Held (outbound pending)" value={formatCurrency(data.totalHeldBalances)} />
                <MetricTile label="Pending deposits" value={`${data.pendingDepositCount} · ${formatCurrency(data.pendingDepositAmount)}`} />
                <MetricTile label="Pending outbound" value={`${data.pendingOutboundCount} · ${formatCurrency(data.pendingOutboundAmount)}`} />
              </div>
            </section>

            <Card title="Settlement accounts" subtitle="Enter the balance you see in each bank app">
              <div className="grid gap-4 md:grid-cols-3">
                {(data.settlementAccounts ?? []).map((acct) => (
                  <div key={acct.provider} className="rounded-xl border border-gray-100 bg-surface-secondary p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200">
                        {acct.provider}
                      </span>
                      {acct.isActive && <span className="badge-success">Active</span>}
                    </div>
                    <p className="font-display font-semibold text-gray-900">{acct.bankName}</p>
                    <p className="mt-1 text-sm text-gray-600">{acct.accountName}</p>
                    <p className="mt-2 font-mono text-xs text-brand-800">{acct.accountNumber}</p>
                    <div className="mt-4">
                      <Input
                        label="Balance in bank app (₦)"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={bankBalances[acct.provider] || ''}
                        onChange={(e) => updateBalance(acct.provider, e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {actualBankTotal > 0 && (
                <p className="mt-4 text-sm text-gray-500">
                  Combined bank total: <span className="font-semibold text-gray-900">{formatCurrency(actualBankTotal)}</span>
                </p>
              )}
            </Card>
          </>
        )}
      </PageShell>
    </DashboardLayout>
  );
}

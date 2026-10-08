'use client';

import { useEffect, useState, FormEvent } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const PROVIDERS = ['ZENITH', 'OPAY', 'MONIEPOINT'] as const;

interface SettlementAccount {
  provider: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  instructions?: string;
  isActive: boolean;
}

interface BackfillPreview {
  total: number;
  sample: { firstName: string; lastName: string; phone: string; customerNumber: string }[];
}

interface BackfillResult {
  scanned: number;
  created: number;
  skipped: number;
  failed: number;
  paymentRefsSynced: number;
  failures: { name: string; error: string }[];
}

export default function SettingsPage() {
  const [accounts, setAccounts] = useState<SettlementAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [backfillPreview, setBackfillPreview] = useState<BackfillPreview | null>(null);
  const [backfillLoading, setBackfillLoading] = useState(false);
  const [backfillRunning, setBackfillRunning] = useState(false);
  const [backfillResult, setBackfillResult] = useState<BackfillResult | null>(null);

  useEffect(() => {
    loadAccounts();
    loadBackfillPreview();
  }, []);

  async function loadBackfillPreview() {
    setBackfillLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: BackfillPreview }>(
        '/settings/member-accounts/backfill-preview',
      );
      setBackfillPreview(res.data);
    } catch {
      setBackfillPreview(null);
    } finally {
      setBackfillLoading(false);
    }
  }

  async function runBackfill() {
    if (!backfillPreview?.total) return;
    const ok = window.confirm(
      `Open a standard Savings account for ${backfillPreview.total} member(s) who do not have one? Each will receive a 10-digit account number.`,
    );
    if (!ok) return;
    setBackfillRunning(true);
    setBackfillResult(null);
    setMessage('');
    try {
      const res = await api.post<{ success: boolean; data: BackfillResult }>(
        '/settings/member-accounts/backfill',
        {},
      );
      setBackfillResult(res.data);
      setMessage(
        `Backfill complete: ${res.data.created} new savings account(s), ${res.data.failed} failed, ${res.data.paymentRefsSynced} payment reference(s) synced.`,
      );
      await loadBackfillPreview();
    } catch {
      setMessage('Member account backfill failed');
    } finally {
      setBackfillRunning(false);
    }
  }

  async function loadAccounts() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: SettlementAccount[] }>('/settings/settlement-accounts');
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(provider: string, e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(provider);
    setMessage('');
    const form = new FormData(e.currentTarget);
    try {
      await api.put(`/settings/settlement-accounts/${provider}`, {
        bankName: form.get('bankName'),
        accountName: form.get('accountName'),
        accountNumber: form.get('accountNumber'),
        instructions: form.get('instructions') || undefined,
        isActive: true,
      });
      setMessage(`${provider} account updated`);
      await loadAccounts();
    } catch {
      setMessage('Failed to update account');
    } finally {
      setSaving(null);
    }
  }

  const accountFor = (provider: string) =>
    accounts.find((a) => a.provider === provider) || {
      provider,
      bankName: provider === 'ZENITH' ? 'Zenith Bank' : provider === 'OPAY' ? 'Opay' : 'Moniepoint',
      accountName: 'Tanjuriel Thrift and Microcredit Cooperative LTD',
      accountNumber: '',
      instructions: 'Use customer payment reference in transfer narration.',
      isActive: true,
    };

  return (
    <DashboardLayout>
      <Header title="System Settings" subtitle="Settlement banks and platform configuration" />
      <div className="p-8 space-y-6">
        {message && <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}
        <Card title="Settlement bank accounts">
          <p className="mb-4 text-sm text-gray-500">
            Customers transfer to these accounts. Managers verify incoming payments before approving deposits.
          </p>
          {loading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : (
            <div className="space-y-6">
              {PROVIDERS.map((provider) => {
                const acct = accountFor(provider);
                return (
                  <form key={provider} onSubmit={(e) => handleSave(provider, e)} className="rounded-lg border border-gray-100 p-4 space-y-3">
                    <h3 className="font-semibold text-gray-900">{provider}</h3>
                    <Input name="bankName" label="Bank name" defaultValue={acct.bankName} required />
                    <Input name="accountName" label="Account name" defaultValue={acct.accountName} required />
                    <Input name="accountNumber" label="Account number" defaultValue={acct.accountNumber} required />
                    <Input name="instructions" label="Instructions for customers" defaultValue={acct.instructions || ''} />
                    <Button type="submit" size="sm" loading={saving === provider}>Save {provider}</Button>
                  </form>
                );
              })}
            </div>
          )}
        </Card>
        <Card title="Savings account numbers">
          <p className="mb-4 text-sm text-gray-500">
            The <strong>Savings account number</strong> (10 digits) is what staff and members use on deposits and
            transfers. Branch registrations before auto-open may exist without a Savings account — run the repair once
            to open accounts for everyone missing one and refresh bank transfer references.
          </p>
          {backfillLoading ? (
            <p className="text-sm text-gray-400">Checking members…</p>
          ) : backfillPreview ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-700">
                Members missing a Savings account:{' '}
                <span className="font-semibold">{backfillPreview.total.toLocaleString()}</span>
              </p>
              {backfillPreview.sample.length > 0 && (
                <ul className="text-sm text-gray-600">
                  {backfillPreview.sample.map((m) => (
                    <li key={m.customerNumber}>
                      {m.firstName} {m.lastName} · {m.phone}
                    </li>
                  ))}
                  {backfillPreview.total > backfillPreview.sample.length && (
                    <li className="text-gray-400">…and {backfillPreview.total - backfillPreview.sample.length} more</li>
                  )}
                </ul>
              )}
              <Button
                type="button"
                loading={backfillRunning}
                disabled={backfillPreview.total === 0}
                onClick={runBackfill}
              >
                Create missing Savings accounts
              </Button>
              {backfillResult && backfillResult.failures.length > 0 && (
                <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  <p className="font-medium">Some members could not be updated:</p>
                  <ul className="mt-2 list-disc pl-5">
                    {backfillResult.failures.slice(0, 8).map((f) => (
                      <li key={f.name}>
                        {f.name}: {f.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Could not load member account status.</p>
          )}
        </Card>
        <Card title="Manual operations mode">
          <p className="text-sm text-gray-500">
            Managers approve all deposits and outbound transfers manually using Zenith, Opay, or Moniepoint apps.
          </p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

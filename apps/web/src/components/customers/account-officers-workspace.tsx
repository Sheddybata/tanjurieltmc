'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';
import { accountOfficerLabel, ACCOUNT_OFFICERS, type AccountOfficerCode } from '@/lib/account-officers';
import { accountTypeLabel } from '@/lib/account-types';
import { formatDate } from '@/lib/utils';
import { primaryMemberAccountNumber } from '@/lib/member-id';
import { useToast } from '@/components/ui/toast-provider';
import { FilterTabs } from '@/components/ui/filter-tabs';

interface MemberRow {
  id: string;
  customerNumber: string;
  firstName: string;
  lastName: string;
  phone: string;
  accountOfficer: AccountOfficerCode | null;
  accountOfficerAssignedAt?: string;
  accounts: { accountNumber: string; type: string; status: string; label?: string }[];
  accountOfficerAssignedBy?: { firstName: string; lastName: string };
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const ASSIGNMENT_TABS = [
  { id: 'all', label: 'All members' },
  { id: 'unassigned', label: 'Needs officer' },
  { id: 'assigned', label: 'Assigned' },
] as const;

export function AccountOfficersWorkspace() {
  const { showToast } = useToast();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [query, setQuery] = useState('');
  const [assignment, setAssignment] = useState<'all' | 'assigned' | 'unassigned'>('unassigned');
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [pickOfficer, setPickOfficer] = useState<AccountOfficerCode | ''>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, assignment]);

  async function load(searchQuery = query) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '50',
        assignment,
      });
      if (searchQuery.trim()) params.set('query', searchQuery.trim());
      const res = await api.get<{ success: boolean; data: MemberRow[]; meta: PaginationMeta }>(
        `/manager/members/with-accounts?${params}`,
      );
      setMembers(res.data ?? []);
      setMeta(res.meta ?? null);
    } catch {
      setMembers([]);
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    void load(query);
  }

  async function saveAssignment(memberId: string) {
    if (!pickOfficer) {
      showToast('Select an account officer', 'error');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/manager/customers/${memberId}/account-officer`, {
        accountOfficer: pickOfficer,
      });
      showToast('Account officer assigned', 'success');
      setAssigningId(null);
      setPickOfficer('');
      await load();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Assignment failed', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 p-8">
      <Card className="p-4">
        <p className="text-sm text-gray-600">
          <strong>Managers and administrators</strong> can assign account officers. Each member gets one
          officer for <strong>all accounts, loans, and services</strong>. Open{' '}
          <Link href="/teller/customers" className="text-brand-600 hover:underline">
            Customers
          </Link>{' '}
          to view a profile after assigning.
        </p>
      </Card>

      <FilterTabs
        tabs={ASSIGNMENT_TABS.map((t) => ({ id: t.id, label: t.label }))}
        active={assignment}
        onChange={(v) => {
          setAssignment(v as typeof assignment);
          setPage(1);
        }}
      />

      <form onSubmit={handleSearch} className="flex max-w-xl gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, phone, account number…"
            className="input-field w-full pl-10"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 pb-3">Member</th>
                <th className="px-4 pb-3">Account number</th>
                <th className="px-4 pb-3">Products</th>
                <th className="px-4 pb-3">Account officer</th>
                <th className="px-4 pb-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              )}
              {!loading && members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No members match this filter.
                  </td>
                </tr>
              )}
              {!loading &&
                members.map((m) => (
                  <tr key={m.id} className="border-b border-gray-50 align-top">
                    <td className="px-4 py-3">
                      <Link href={`/teller/customers/${m.id}`} className="font-medium text-brand-600 hover:underline">
                        {m.firstName} {m.lastName}
                      </Link>
                      <p className="text-xs text-gray-500">{m.phone}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{primaryMemberAccountNumber(m.accounts)}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {m.accounts.map((a) => (
                        <span key={a.accountNumber} className="mr-2 inline-block">
                          {accountTypeLabel(a.type)}
                          {a.label ? ` (${a.label})` : ''}
                        </span>
                      ))}
                    </td>
                    <td className="px-4 py-3">
                      {m.accountOfficer ? (
                        <div>
                          <p className="font-medium text-gray-900">{accountOfficerLabel(m.accountOfficer)}</p>
                          {m.accountOfficerAssignedAt && (
                            <p className="text-xs text-gray-500">Since {formatDate(m.accountOfficerAssignedAt)}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-amber-700">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {assigningId === m.id ? (
                        <div className="flex min-w-[220px] flex-col gap-2">
                          <Select
                            label=""
                            value={pickOfficer}
                            onChange={(e) => setPickOfficer(e.target.value as AccountOfficerCode)}
                            options={[
                              { value: '', label: 'Select officer…' },
                              ...ACCOUNT_OFFICERS.map((o) => ({ value: o.value, label: o.label })),
                            ]}
                          />
                          <div className="flex gap-2">
                            <Button type="button" loading={saving} onClick={() => void saveAssignment(m.id)}>
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => {
                                setAssigningId(null);
                                setPickOfficer('');
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setAssigningId(m.id);
                            setPickOfficer(m.accountOfficer ?? '');
                          }}
                        >
                          {m.accountOfficer ? 'Reassign' : 'Assign account officer'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-sm text-gray-500">
              Page {meta.page} of {meta.totalPages} · {meta.total} members
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

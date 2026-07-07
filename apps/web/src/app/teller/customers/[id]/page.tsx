'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { accountTypeLabel } from '@/lib/account-types';
import { contributionFrequencyLabel } from '@/lib/contribution-frequency';
import { formatCurrency, formatDate } from '@/lib/utils';
import { primaryMemberAccountNumber } from '@/lib/member-id';
import { CustomerBioCard } from '@/components/customers/customer-bio-card';
import { apiAssetUrl } from '@/lib/api-origin';
import { useToast } from '@/components/ui/toast-provider';

interface CustomerDetail {
  id: string;
  customerNumber: string;
  title?: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  gender?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  bvn?: string;
  nin?: string;
  address?: string;
  lga?: string;
  city?: string;
  state?: string;
  employmentStatus?: string;
  employmentStatusNote?: string;
  employmentStartDate?: string;
  incomeBand?: string;
  occupation?: string;
  employer?: string;
  employerPhone?: string;
  employerEmail?: string;
  employerAddress?: string;
  natureOfBusiness?: string;
  officeNumber?: string;
  officePhone?: string;
  officeState?: string;
  officeLga?: string;
  photoUrl?: string;
  kycStatus: string;
  appEnabled?: boolean;
  registrationSource?: string;
  createdAt: string;
  branch?: { name: string };
  accounts: {
    id: string;
    accountNumber: string;
    type: string;
    status: string;
    balance: number;
    label?: string;
    maturityDate?: string;
    contributionFrequency?: string;
    childPhotoUrl?: string;
    childDateOfBirth?: string;
    childSchool?: string;
    fatherName?: string;
    motherName?: string;
  }[];
  loans: { id: string; loanNumber: string; status: string; outstandingBalance: number }[];
}

interface Transaction {
  id: string;
  reference: string;
  type: string;
  amount: number;
  status: string;
  createdAt: string;
}

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [appPin, setAppPin] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const childSavingsAccounts = customer?.accounts?.filter((a) => a.type === 'MY_PIKIN') ?? [];

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: CustomerDetail }>(`/teller/customers/${id}`);
      setCustomer(res.data);
      const primaryAccount = res.data.accounts?.[0];
      if (primaryAccount) {
        const txRes = await api.get<{ success: boolean; data: Transaction[] }>(
          `/teller/accounts/${primaryAccount.id}/transactions?limit=20`,
        );
        setTransactions(txRes.data ?? []);
      }
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Failed to load customer', 'error');
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }

  async function verifyKyc() {
    setActionLoading('kyc');
    try {
      await api.patch(`/teller/customers/${id}/verify-kyc`);
      showToast('KYC verified', 'success');
      await load();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'KYC verification failed', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  async function enableMobile() {
    if (!appPin.trim() || appPin.length < 4) {
      showToast('Enter a 4–6 digit PIN', 'error');
      return;
    }
    setActionLoading('mobile');
    try {
      await api.patch(`/teller/customers/${id}/mobile-access`, { appPin });
      showToast('Mobile access enabled', 'success');
      setAppPin('');
      await load();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Could not enable mobile', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <PageShell>
          <p className="text-gray-500">Customer not found.</p>
          <Link href="/teller/customers" className="text-brand-600 hover:underline">Back to customers</Link>
        </PageShell>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header
        title={`${customer.firstName} ${customer.lastName}`}
        subtitle={primaryMemberAccountNumber(customer.accounts, customer.phone)}
      />
      <PageShell>
        <div className="mb-4">
          <Link href="/teller/customers" className="text-sm text-brand-600 hover:underline">← Back to customers</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold">Member profile</h2>
            <CustomerBioCard customer={customer} />
            <dl className="mt-6 space-y-3 border-t border-gray-100 pt-4 text-sm">
              <div><dt className="text-gray-500">Member ID</dt><dd className="font-mono">{primaryMemberAccountNumber(customer.accounts, customer.phone)}</dd></div>
              <div><dt className="text-gray-500">KYC</dt><dd><StatusBadge status={customer.kycStatus} /></dd></div>
              <div><dt className="text-gray-500">Mobile app</dt><dd>{customer.appEnabled ? 'Enabled' : 'Not enabled'}</dd></div>
              <div><dt className="text-gray-500">Registration</dt><dd>{customer.registrationSource || 'BRANCH'}</dd></div>
              <div><dt className="text-gray-500">Branch</dt><dd>{customer.branch?.name || 'Head Office – Jos'}</dd></div>
              <div><dt className="text-gray-500">Joined</dt><dd>{formatDate(customer.createdAt)}</dd></div>
            </dl>
            {customer.kycStatus === 'PENDING' && (
              <Button className="mt-4" loading={actionLoading === 'kyc'} onClick={verifyKyc}>
                Verify KYC
              </Button>
            )}
          </Card>
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Accounts</h2>
              <div className="flex gap-3">
                <Link href={`/teller/accounts/new?customerId=${customer.id}`} className="text-sm text-brand-600 hover:underline">
                  Open account
                </Link>
                <Link href={`/manager/loans/new?customerId=${customer.id}`} className="text-sm text-brand-600 hover:underline">
                  New loan application
                </Link>
              </div>
            </div>
            {customer.accounts?.length ? (
              <ul className="space-y-3">
                {customer.accounts.map((a) => (
                  <li key={a.id} className="rounded-lg border border-gray-100 p-3">
                    <p className="font-mono text-brand-700">{a.accountNumber}</p>
                    <p className="text-sm text-gray-600">
                      {accountTypeLabel(a.type)}
                      {a.label ? ` · ${a.label}` : ''}
                      {a.contributionFrequency ? ` · ${contributionFrequencyLabel(a.contributionFrequency)}` : ''} · {a.status}
                    </p>
                    {a.type === 'MY_PIKIN' && a.maturityDate && (
                      <p className="text-xs text-amber-700">Maturity: {formatDate(a.maturityDate)}</p>
                    )}
                    <p className="font-medium">{formatCurrency(Number(a.balance))}</p>
                    {a.type === 'MY_PIKIN' && (
                      <Button
                        type="button"
                        variant="secondary"
                        className="mt-2"
                        loading={actionLoading === `pdf-${a.id}`}
                        onClick={async () => {
                          setActionLoading(`pdf-${a.id}`);
                          try {
                            await api.downloadPdf(
                              `/teller/accounts/${a.id}/child-savings/statement.pdf`,
                              `child-savings-${a.label ?? a.accountNumber}.pdf`,
                            );
                            showToast('Statement downloaded', 'success');
                          } catch (err: unknown) {
                            showToast((err as { message?: string })?.message || 'Could not download statement', 'error');
                          } finally {
                            setActionLoading(null);
                          }
                        }}
                      >
                        Download statement (PDF)
                      </Button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No accounts</p>
            )}
          </Card>
        </div>

        {childSavingsAccounts.length > 0 && (
          <Card className="mt-6 p-6">
            <h2 className="mb-4 text-lg font-semibold">Child Savings profiles</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {childSavingsAccounts.map((a) => {
                const photoUrl = apiAssetUrl(a.childPhotoUrl);
                return (
                  <div key={a.id} className="flex gap-4 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
                    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photoUrl} alt={a.label ?? 'Child'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-400">No photo</div>
                      )}
                    </div>
                    <dl className="space-y-1 text-sm">
                      <div><dt className="text-gray-500">Child</dt><dd className="font-medium">{a.label ?? '—'}</dd></div>
                      <div><dt className="text-gray-500">DOB</dt><dd>{a.childDateOfBirth ? formatDate(a.childDateOfBirth) : '—'}</dd></div>
                      <div><dt className="text-gray-500">School</dt><dd>{a.childSchool ?? '—'}</dd></div>
                      <div><dt className="text-gray-500">Father</dt><dd>{a.fatherName ?? '—'}</dd></div>
                      <div><dt className="text-gray-500">Mother</dt><dd>{a.motherName ?? '—'}</dd></div>
                      <div><dt className="text-gray-500">Maturity</dt><dd>{a.maturityDate ? formatDate(a.maturityDate) : '—'}</dd></div>
                    </dl>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-lg font-semibold">Mobile app access</h2>
          <p className="mb-3 text-sm text-gray-600">
            Set a PIN so this member can log in on mobile with their phone number.
          </p>
          <div className="flex max-w-sm flex-col gap-3 sm:flex-row sm:items-end">
            <Input
              label="App PIN"
              placeholder="4–6 digits"
              value={appPin}
              onChange={(e) => setAppPin(e.target.value)}
              maxLength={6}
            />
            <Button loading={actionLoading === 'mobile'} onClick={enableMobile}>
              {customer.appEnabled ? 'Reset PIN' : 'Enable mobile'}
            </Button>
          </div>
        </Card>

        {customer.loans?.length > 0 && (
          <Card className="mt-6 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Loans</h2>
              <Link href="/teller/loan-repayments" className="text-sm text-brand-600 hover:underline">
                Record cash repayment
              </Link>
            </div>
            <ul className="space-y-2">
              {customer.loans.map((l) => (
                <li key={l.id} className="flex justify-between text-sm">
                  <Link href={`/manager/loans/${l.id}`} className="font-mono text-brand-600 hover:underline">{l.loanNumber}</Link>
                  <span>{l.status} · {formatCurrency(Number(l.outstandingBalance))}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card className="mt-6 p-6">
          <h2 className="mb-4 text-lg font-semibold">Recent transactions</h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500">No transactions on primary account.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-500">
                  <th className="pb-2">Reference</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Amount</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t.id} className="border-b border-gray-50">
                    <td className="py-2 font-mono text-xs">{t.reference}</td>
                    <td className="py-2">{t.type.replace(/_/g, ' ')}</td>
                    <td className="py-2">{formatCurrency(Number(t.amount))}</td>
                    <td className="py-2"><StatusBadge status={t.status} /></td>
                    <td className="py-2 text-gray-500">{formatDate(t.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </PageShell>
    </DashboardLayout>
  );
}

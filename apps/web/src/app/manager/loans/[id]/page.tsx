'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PageShell } from '@/components/ui/page-shell';
import { StatusBadge } from '@/components/ui/status-badge';
import { api } from '@/lib/api';
import { apiAssetUrl } from '@/lib/api-origin';
import {
  educationLabel,
  genderLabel,
  loanCategoryLabel,
  locationLabel,
  maritalLabel,
  repaymentPlanLabel,
} from '@/lib/loan-application-options';
import { formatCurrency, formatDate } from '@/lib/utils';
import { primaryMemberAccountNumber } from '@/lib/member-id';
import { useToast } from '@/components/ui/toast-provider';

interface LoanDetail {
  id: string;
  loanNumber: string;
  status: string;
  principalAmount: number;
  tenureMonths: number;
  tenurePeriods?: number;
  monthlyPayment: number;
  installmentAmount?: number;
  totalRepayable: number;
  outstandingBalance: number;
  openingFeeAmount?: number;
  upfrontFeeAmount?: number;
  flatInterestAmount?: number;
  repaymentPlan?: string;
  loanCategory?: string;
  purpose?: string;
  applicantFullName?: string;
  locationType?: string;
  applicantAddress?: string;
  applicantGender?: string;
  applicantDateOfBirth?: string;
  educationLevel?: string;
  maritalStatus?: string;
  businessActivities?: string[];
  yearsOfExperience?: number;
  unionName?: string;
  nextOfKinName?: string;
  nextOfKinPhone?: string;
  nextOfKinAddress?: string;
  contractAcceptedAt?: string;
  collateral?: string;
  collateralType?: string;
  collateralEstimatedValue?: number;
  collateralPhotoUrl?: string;
  collateralVerifiedAt?: string | null;
  guarantorName?: string;
  guarantorPhone?: string;
  submittedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    accounts?: { accountNumber: string; type: string }[];
  };
  product: { name: string; code: string; requiresCollateral?: boolean };
  schedules: { installmentNumber: number; dueDate: string; totalDue: number; isPaid: boolean }[];
}

export default function LoanDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { showToast } = useToast();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    load();
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: LoanDetail }>(`/manager/loans/${id}`);
      setLoan(res.data);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Failed to load loan', 'error');
      setLoan(null);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(action: 'review' | 'approve' | 'reject' | 'verify-collateral' | 'disburse') {
    setActionLoading(true);
    try {
      await api.post(`/manager/loans/${id}/${action}`, { comment: `${action} from loan detail` });
      showToast(`Loan ${action.replace('-', ' ')} successful`, 'success');
      await load();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Action failed', 'error');
    } finally {
      setActionLoading(false);
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

  if (!loan) {
    return (
      <DashboardLayout>
        <PageShell>
          <p className="text-gray-500">Loan not found.</p>
          <Link href="/manager/loans" className="text-brand-600 hover:underline">Back to loans</Link>
        </PageShell>
      </DashboardLayout>
    );
  }

  const needsCollateral = loan.product.requiresCollateral !== false;
  const collateralVerified = Boolean(loan.collateralVerifiedAt);
  const nextDue = loan.schedules?.find((s) => !s.isPaid);
  const installment = loan.installmentAmount ?? loan.monthlyPayment;
  const photoUrl = apiAssetUrl(loan.collateralPhotoUrl);
  const activities = Array.isArray(loan.businessActivities) ? loan.businessActivities : [];

  return (
    <DashboardLayout>
      <Header title={loan.loanNumber} subtitle={`${loan.customer.firstName} ${loan.customer.lastName} · ${loan.product.name}`} />
      <PageShell>
        <div className="mb-4 flex flex-wrap gap-3">
          <Link href="/manager/loans" className="text-sm text-brand-600 hover:underline">← All loans</Link>
          <Link href="/manager/approvals" className="text-sm text-brand-600 hover:underline">Approval queue</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <StatusBadge status={loan.status} />
              <span className="text-2xl font-bold text-brand-700">{formatCurrency(Number(loan.principalAmount))}</span>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><dt className="text-gray-500">Customer</dt><dd>{loan.customer.firstName} {loan.customer.lastName}</dd></div>
              <div><dt className="text-gray-500">Member ID</dt><dd className="font-mono">{primaryMemberAccountNumber(loan.customer.accounts, loan.customer.phone)}</dd></div>
              <div><dt className="text-gray-500">Loan type</dt><dd>{loan.loanCategory ? loanCategoryLabel(loan.loanCategory) : loan.product.name}</dd></div>
              <div><dt className="text-gray-500">Repayment</dt><dd>{loan.repaymentPlan ? repaymentPlanLabel(loan.repaymentPlan) : 'Monthly'}</dd></div>
              <div><dt className="text-gray-500">Duration</dt><dd>{loan.tenurePeriods ? `${loan.tenurePeriods} periods (${loan.tenureMonths} mo equiv.)` : `${loan.tenureMonths} months`}</dd></div>
              <div><dt className="text-gray-500">Installment</dt><dd>{formatCurrency(Number(installment))}</dd></div>
              <div><dt className="text-gray-500">Total repayable</dt><dd>{formatCurrency(Number(loan.totalRepayable))}</dd></div>
              <div><dt className="text-gray-500">Outstanding</dt><dd>{formatCurrency(Number(loan.outstandingBalance))}</dd></div>
              {loan.openingFeeAmount != null && <div><dt className="text-gray-500">Opening fee</dt><dd>{formatCurrency(Number(loan.openingFeeAmount))}</dd></div>}
              {loan.upfrontFeeAmount != null && <div><dt className="text-gray-500">Upfront fee</dt><dd>{formatCurrency(Number(loan.upfrontFeeAmount))}</dd></div>}
              {loan.flatInterestAmount != null && <div><dt className="text-gray-500">Interest</dt><dd>{formatCurrency(Number(loan.flatInterestAmount))}</dd></div>}
              {loan.purpose && <div className="sm:col-span-2"><dt className="text-gray-500">Purpose</dt><dd>{loan.purpose}</dd></div>}
              {nextDue && (
                <div className="sm:col-span-2">
                  <dt className="text-gray-500">Next repayment</dt>
                  <dd>{formatDate(nextDue.dueDate)} — {formatCurrency(Number(nextDue.totalDue))}</dd>
                </div>
              )}
              {loan.contractAcceptedAt && (
                <div className="sm:col-span-2"><dt className="text-gray-500">Contract accepted</dt><dd>{formatDate(loan.contractAcceptedAt)}</dd></div>
              )}
            </dl>
          </Card>
          <Card className="p-6">
            <h2 className="mb-4 font-semibold">Actions</h2>
            <div className="flex flex-col gap-2">
              {loan.status === 'SUBMITTED' && (
                <Button variant="secondary" loading={actionLoading} onClick={() => handleAction('review')}>Mark under review</Button>
              )}
              {needsCollateral && !collateralVerified && (
                <Button variant="secondary" loading={actionLoading} onClick={() => handleAction('verify-collateral')}>Verify collateral</Button>
              )}
              {['SUBMITTED', 'UNDER_REVIEW'].includes(loan.status) && (
                <>
                  <Button loading={actionLoading} disabled={needsCollateral && !collateralVerified} onClick={() => handleAction('approve')}>Approve</Button>
                  <Button variant="danger" loading={actionLoading} onClick={() => handleAction('reject')}>Reject</Button>
                </>
              )}
              {loan.status === 'APPROVED' && (
                <Button loading={actionLoading} onClick={() => handleAction('disburse')}>Disburse loan</Button>
              )}
            </div>
          </Card>
        </div>

        {loan.applicantFullName && (
          <Card className="mt-6 p-6">
            <h2 className="mb-4 font-semibold">Applicant profile (from application)</h2>
            <dl className="grid gap-2 sm:grid-cols-2 text-sm">
              <div><dt className="text-gray-500">Full name</dt><dd>{loan.applicantFullName}</dd></div>
              {loan.locationType && <div><dt className="text-gray-500">Location</dt><dd>{locationLabel(loan.locationType)}</dd></div>}
              {loan.applicantAddress && <div className="sm:col-span-2"><dt className="text-gray-500">Address</dt><dd>{loan.applicantAddress}</dd></div>}
              {loan.applicantGender && <div><dt className="text-gray-500">Gender</dt><dd>{genderLabel(loan.applicantGender)}</dd></div>}
              {loan.applicantDateOfBirth && <div><dt className="text-gray-500">Date of birth</dt><dd>{formatDate(loan.applicantDateOfBirth)}</dd></div>}
              {loan.educationLevel && <div><dt className="text-gray-500">Education</dt><dd>{educationLabel(loan.educationLevel)}</dd></div>}
              {loan.maritalStatus && <div><dt className="text-gray-500">Marital status</dt><dd>{maritalLabel(loan.maritalStatus)}</dd></div>}
              {activities.length > 0 && <div className="sm:col-span-2"><dt className="text-gray-500">Business</dt><dd>{activities.join(', ')}</dd></div>}
              {loan.yearsOfExperience != null && <div><dt className="text-gray-500">Experience</dt><dd>{loan.yearsOfExperience} years</dd></div>}
              {loan.unionName && <div><dt className="text-gray-500">Union</dt><dd>{loan.unionName}</dd></div>}
              {loan.nextOfKinName && <div><dt className="text-gray-500">Next of kin</dt><dd>{loan.nextOfKinName} · {loan.nextOfKinPhone}</dd></div>}
              {loan.nextOfKinAddress && <div className="sm:col-span-2"><dt className="text-gray-500">Next of kin address</dt><dd>{loan.nextOfKinAddress}</dd></div>}
            </dl>
          </Card>
        )}

        {(loan.collateral || loan.guarantorName) && (
          <Card className="mt-6 p-6">
            <h2 className="mb-4 font-semibold">Collateral & guarantor</h2>
            <div className="flex flex-col gap-4 lg:flex-row">
              {photoUrl && (
                <div className="h-32 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photoUrl} alt="Collateral" className="h-full w-full object-cover" />
                </div>
              )}
              <dl className="grid flex-1 gap-2 sm:grid-cols-2 text-sm">
                {loan.collateralType && <div><dt className="text-gray-500">Type</dt><dd>{loan.collateralType}</dd></div>}
                {loan.collateralEstimatedValue != null && (
                  <div><dt className="text-gray-500">Est. value</dt><dd>{formatCurrency(Number(loan.collateralEstimatedValue))}</dd></div>
                )}
                {loan.collateral && <div className="sm:col-span-2"><dt className="text-gray-500">Description</dt><dd>{loan.collateral}</dd></div>}
                {loan.guarantorName && <div><dt className="text-gray-500">Guarantor</dt><dd>{loan.guarantorName}</dd></div>}
                {loan.guarantorPhone && <div><dt className="text-gray-500">Guarantor phone</dt><dd>{loan.guarantorPhone}</dd></div>}
                <div><dt className="text-gray-500">Verified</dt><dd>{collateralVerified ? formatDate(loan.collateralVerifiedAt!) : 'Pending'}</dd></div>
              </dl>
            </div>
          </Card>
        )}
      </PageShell>
    </DashboardLayout>
  );
}

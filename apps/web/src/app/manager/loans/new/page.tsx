'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { LoanApplicationWizard } from '@/components/loans/loan-application-wizard';

function NewLoanForm() {
  const searchParams = useSearchParams();
  const customerId = searchParams.get('customerId') ?? '';
  return <LoanApplicationWizard initialCustomerId={customerId} />;
}

export default function NewLoanPage() {
  return (
    <DashboardLayout>
      <Header
        title="New loan application"
        subtitle="Same 5-step flow as mobile — linked to the member's account"
      />
      <div className="p-8">
        <Suspense fallback={<Card className="max-w-3xl p-6 text-sm text-gray-500">Loading…</Card>}>
          <NewLoanForm />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

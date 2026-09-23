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
  return (
    <LoanApplicationWizard
      initialCustomerId={customerId}
      customersPath="/teller/customers?limit=100"
      customerPath={(id) => `/teller/customers/${id}`}
      quotePath="/teller/loans/quote"
      submitPath="/teller/loans"
      successPath={(id) => `/teller/loans/${id}`}
      submitHint="This records a paper or walk-in application on the same loan register as mobile. A manager must still review, approve, and disburse."
    />
  );
}

export default function TellerNewLoanPage() {
  return (
    <DashboardLayout>
      <Header
        title="Record loan application"
        subtitle="Key in a paper or walk-in application — manager approval is still required"
      />
      <div className="p-8">
        <Suspense fallback={<Card className="max-w-3xl p-6 text-sm text-gray-500">Loading…</Card>}>
          <NewLoanForm />
        </Suspense>
      </div>
    </DashboardLayout>
  );
}

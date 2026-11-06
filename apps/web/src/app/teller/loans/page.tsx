'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { LoanApplicationsRegister } from '@/components/loans/loan-applications-register';

export default function TellerLoansPage() {
  return (
    <DashboardLayout>
      <Header
        title="Loan applications"
        subtitle="Paper and walk-in applications you record here go to the manager approval queue"
      />
      <LoanApplicationsRegister
        apiBasePath="/teller/loans"
        detailHrefPrefix="/teller/loans"
        sectionTitle="Application register"
        sectionDescription="Filter by stage and search; totals match your full pipeline"
        newLoanHref="/teller/loans/new"
        newLoanLabel="Record application"
      />
    </DashboardLayout>
  );
}

'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { LoanApplicationsRegister } from '@/components/loans/loan-applications-register';

export default function LoansPage() {
  return (
    <DashboardLayout>
      <Header title="Loan Applications" subtitle="Browse and track all loan applications across the branch" />
      <LoanApplicationsRegister
        apiBasePath="/manager/loans"
        detailHrefPrefix="/manager/loans"
        sectionTitle="Application register"
        sectionDescription="Filter by pipeline stage, search by loan number, customer, or account"
        newLoanHref="/manager/loans/new"
        newLoanLabel="New application"
      />
    </DashboardLayout>
  );
}

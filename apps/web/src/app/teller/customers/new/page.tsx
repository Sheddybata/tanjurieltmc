'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { PageShell } from '@/components/ui/page-shell';
import { CustomerRegistrationWizard } from '@/components/customers/customer-registration-wizard';

export default function RegisterCustomerPage() {
  return (
    <DashboardLayout>
      <Header title="Register Customer" subtitle="Capture full KYC profile — matches mobile sign-up" />
      <PageShell>
        <CustomerRegistrationWizard />
      </PageShell>
    </DashboardLayout>
  );
}

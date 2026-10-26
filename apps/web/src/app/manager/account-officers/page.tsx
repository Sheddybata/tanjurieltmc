'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { AccountOfficersWorkspace } from '@/components/customers/account-officers-workspace';

export default function ManagerAccountOfficersPage() {
  return (
    <DashboardLayout>
      <Header
        title="Account officers"
        subtitle="Assign an officer to each member — applies to all accounts, loans, and services"
      />
      <AccountOfficersWorkspace />
    </DashboardLayout>
  );
}

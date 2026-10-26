'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { AccountOfficersWorkspace } from '@/components/customers/account-officers-workspace';

export default function AdminAccountOfficersPage() {
  return (
    <DashboardLayout>
      <Header
        title="Account officers"
        subtitle="Administrator: assign officers to members (same as branch managers)"
      />
      <AccountOfficersWorkspace />
    </DashboardLayout>
  );
}

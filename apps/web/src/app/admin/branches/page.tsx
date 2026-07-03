'use client';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';

export default function BranchesPage() {
  return (
    <DashboardLayout>
      <Header title="Branch Management" subtitle="Configure branch locations and settings" />
      <div className="p-8">
        <Card>
          <p className="text-sm text-gray-500">Branch CRUD endpoints are available via the Admin API. Extend this page to add branch creation and editing forms.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}

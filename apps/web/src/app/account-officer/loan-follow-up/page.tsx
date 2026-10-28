'use client';

import { Suspense } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card } from '@/components/ui/card';
import { LoanFollowUpContent } from './loan-follow-up-content';

export default function AccountOfficerLoanFollowUpPage() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={
          <div className="p-8">
            <Card className="p-6 text-sm text-gray-500">Loading…</Card>
          </div>
        }
      >
        <LoanFollowUpContent />
      </Suspense>
    </DashboardLayout>
  );
}

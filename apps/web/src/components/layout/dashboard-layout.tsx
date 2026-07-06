'use client';

import { ReactNode, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { canAccessPath, accessDeniedRedirect, StaffRole } from '@/lib/role-access';

export function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/staff/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && !canAccessPath(user.role as StaffRole, pathname)) {
      router.replace(accessDeniedRedirect(user.role as StaffRole));
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) return null;

  if (!canAccessPath(user.role as StaffRole, pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">You do not have access to this page.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      <Sidebar />
      <main className="min-w-0 pl-64">{children}</main>
    </div>
  );
}

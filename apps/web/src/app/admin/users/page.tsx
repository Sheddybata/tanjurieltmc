'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/navigation';
import { UserRole } from '@tanjuriel/shared';

interface SystemUser {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  branch?: { name: string };
}

export default function UsersAdminPage() {
  const [users, setUsers] = useState<SystemUser[]>([]);

  useEffect(() => {
    api.get<{ success: boolean; data: SystemUser[] }>('/users')
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, []);

  return (
    <DashboardLayout>
      <Header title="User Management" subtitle="Manage system users and role assignments" />
      <div className="p-8">
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="pb-3 pr-4">Employee ID</th>
                  <th className="pb-3 pr-4">Name</th>
                  <th className="pb-3 pr-4">Email</th>
                  <th className="pb-3 pr-4">Role</th>
                  <th className="pb-3 pr-4">Branch</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-50">
                    <td className="py-3 pr-4 font-mono text-xs">{u.employeeId}</td>
                    <td className="py-3 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                    <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                    <td className="py-3 pr-4"><span className={ROLE_COLORS[u.role as UserRole]}>{ROLE_LABELS[u.role as UserRole]}</span></td>
                    <td className="py-3 pr-4 text-gray-600">{u.branch?.name || '—'}</td>
                    <td className="py-3"><span className={u.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}>{u.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}

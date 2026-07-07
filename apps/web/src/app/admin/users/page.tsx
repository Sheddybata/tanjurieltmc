'use client';

import { FormEvent, useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Header } from '@/components/layout/header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { ROLE_COLORS, ROLE_LABELS } from '@/lib/navigation';
import { UserRole } from '@tanjuriel/shared';
import { useToast } from '@/components/ui/toast-provider';

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

const STAFF_ROLES = [UserRole.TELLER, UserRole.MANAGER];

export default function UsersAdminPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [createForm, setCreateForm] = useState({
    employeeId: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.TELLER,
  });

  async function loadUsers() {
    setLoading(true);
    try {
      const res = await api.get<{ success: boolean; data: SystemUser[] }>('/users?limit=100');
      setUsers(res.data ?? []);
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/users', {
        ...createForm,
        phone: createForm.phone || undefined,
      });
      showToast('Staff account created', 'success');
      setShowCreate(false);
      setCreateForm({
        employeeId: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: UserRole.TELLER,
      });
      await loadUsers();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Could not create user', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function toggleStatus(user: SystemUser) {
    const next = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.patch(`/users/${user.id}`, { status: next });
      showToast(next === 'INACTIVE' ? 'Login access revoked' : 'Account reactivated', 'success');
      await loadUsers();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Could not update status', 'error');
    }
  }

  async function handleResetPassword(e: FormEvent) {
    e.preventDefault();
    if (!resetUserId || newPassword.length < 8) {
      showToast('Password must be at least 8 characters', 'error');
      return;
    }
    setResetting(true);
    try {
      await api.patch(`/users/${resetUserId}/password`, { password: newPassword });
      showToast('Password updated', 'success');
      setResetUserId(null);
      setNewPassword('');
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Could not reset password', 'error');
    } finally {
      setResetting(false);
    }
  }

  return (
    <DashboardLayout>
      <Header title="User Management" subtitle="Create teller and manager accounts, revoke login, reset passwords" />
      <div className="space-y-6 p-8">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Staff accounts</h2>
            <Button type="button" variant="secondary" onClick={() => setShowCreate((v) => !v)}>
              {showCreate ? 'Cancel' : 'Create staff'}
            </Button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} className="mb-6 grid gap-4 border-b border-gray-100 pb-6 md:grid-cols-2">
              <Input
                label="Employee ID"
                value={createForm.employeeId}
                onChange={(e) => setCreateForm({ ...createForm, employeeId: e.target.value })}
                required
              />
              <Input
                label="Email"
                type="email"
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                required
              />
              <Input
                label="First name"
                value={createForm.firstName}
                onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                required
              />
              <Input
                label="Last name"
                value={createForm.lastName}
                onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                required
              />
              <Input
                label="Phone (optional)"
                value={createForm.phone}
                onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
              />
              <Select
                label="Role"
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as UserRole })}
                options={STAFF_ROLES.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              />
              <Input
                label="Permanent password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                minLength={8}
                required
              />
              <div className="flex items-end">
                <Button type="submit" loading={creating}>Create account</Button>
              </div>
            </form>
          )}

          {resetUserId && (
            <form onSubmit={handleResetPassword} className="mb-6 flex flex-wrap items-end gap-3 rounded-lg bg-gray-50 p-4">
              <Input
                label="New password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
                className="min-w-[220px]"
              />
              <Button type="submit" loading={resetting}>Save password</Button>
              <Button type="button" variant="secondary" onClick={() => { setResetUserId(null); setNewPassword(''); }}>
                Cancel
              </Button>
            </form>
          )}

          {loading ? (
            <p className="text-sm text-gray-500">Loading users…</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="pb-3 pr-4">Employee ID</th>
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Email</th>
                    <th className="pb-3 pr-4">Role</th>
                    <th className="pb-3 pr-4">Branch</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter((u) => u.role === UserRole.TELLER || u.role === UserRole.MANAGER).map((u) => (
                    <tr key={u.id} className="border-b border-gray-50">
                      <td className="py-3 pr-4 font-mono text-xs">{u.employeeId}</td>
                      <td className="py-3 pr-4 font-medium">{u.firstName} {u.lastName}</td>
                      <td className="py-3 pr-4 text-gray-600">{u.email}</td>
                      <td className="py-3 pr-4">
                        <span className={ROLE_COLORS[u.role as UserRole]}>{ROLE_LABELS[u.role as UserRole]}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{u.branch?.name || '—'}</td>
                      <td className="py-3 pr-4">
                        <span className={u.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}>{u.status}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="text-xs text-brand-600 hover:underline"
                            onClick={() => setResetUserId(u.id)}
                          >
                            Reset password
                          </button>
                          <button
                            type="button"
                            className="text-xs text-amber-700 hover:underline"
                            onClick={() => toggleStatus(u)}
                          >
                            {u.status === 'ACTIVE' ? 'Revoke login' : 'Reactivate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}

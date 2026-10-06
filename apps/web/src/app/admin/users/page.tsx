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

interface BranchOption {
  id: string;
  code: string;
  name: string;
}

interface SystemUser {
  id: string;
  employeeId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
  branchId?: string | null;
  branch?: { id: string; name: string };
}

const STAFF_ROLES = [UserRole.TELLER, UserRole.MANAGER];

const emptyCreateForm = {
  employeeId: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  phone: '',
  role: UserRole.TELLER,
  branchId: '',
};

export default function UsersAdminPage() {
  const { showToast } = useToast();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [branches, setBranches] = useState<BranchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [assigningBranchUserId, setAssigningBranchUserId] = useState<string | null>(null);
  const [assignBranchId, setAssignBranchId] = useState('');
  const [createForm, setCreateForm] = useState(emptyCreateForm);

  async function loadBranches() {
    try {
      const res = await api.get<{ success: boolean; data: BranchOption[] }>('/reporting/branches');
      const list = res.data ?? [];
      setBranches(list);
      if (list.length === 1) {
        setCreateForm((f) => (f.branchId ? f : { ...f, branchId: list[0].id }));
      }
    } catch {
      showToast('Could not load branches', 'error');
    }
  }

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
    loadBranches();
    loadUsers();
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!createForm.branchId) {
      showToast('Select a branch for this staff member', 'error');
      return;
    }
    setCreating(true);
    try {
      await api.post('/users', {
        ...createForm,
        phone: createForm.phone || undefined,
      });
      showToast('Staff account created', 'success');
      setShowCreate(false);
      setCreateForm({ ...emptyCreateForm, branchId: branches.length === 1 ? branches[0].id : '' });
      await loadUsers();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Could not create user', 'error');
    } finally {
      setCreating(false);
    }
  }

  async function saveBranchAssignment(userId: string) {
    if (!assignBranchId) {
      showToast('Select a branch', 'error');
      return;
    }
    try {
      await api.patch(`/users/${userId}`, { branchId: assignBranchId });
      showToast('Branch assigned — teller can register customers after signing in again', 'success');
      setAssigningBranchUserId(null);
      setAssignBranchId('');
      await loadUsers();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Could not assign branch', 'error');
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

  const branchOptions = [
    { value: '', label: branches.length ? 'Select branch…' : 'No branches available' },
    ...branches.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
  ];

  return (
    <DashboardLayout>
      <Header
        title="User Management"
        subtitle="Create teller and manager accounts with a branch — required for customer registration"
      />
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
              <Select
                label="Branch"
                value={createForm.branchId}
                onChange={(e) => setCreateForm({ ...createForm, branchId: e.target.value })}
                options={branchOptions}
                required
              />
              <Input
                label="Permanent password"
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                minLength={8}
                required
              />
              <div className="flex items-end md:col-span-2">
                <Button type="submit" loading={creating} disabled={!branches.length}>
                  Create account
                </Button>
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
                      <td className="py-3 pr-4 text-gray-600">
                        {assigningBranchUserId === u.id ? (
                          <div className="flex min-w-[200px] flex-col gap-2">
                            <Select
                              value={assignBranchId}
                              onChange={(e) => setAssignBranchId(e.target.value)}
                              options={branchOptions}
                            />
                            <div className="flex gap-2">
                              <Button type="button" size="sm" onClick={() => saveBranchAssignment(u.id)}>
                                Save
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                onClick={() => { setAssigningBranchUserId(null); setAssignBranchId(''); }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : u.branch?.name ? (
                          u.branch.name
                        ) : (
                          <span className="text-amber-700">Not assigned</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <span className={u.status === 'ACTIVE' ? 'badge-success' : 'badge-neutral'}>{u.status}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          {!u.branch?.name && assigningBranchUserId !== u.id && (
                            <button
                              type="button"
                              className="text-xs font-medium text-brand-600 hover:underline"
                              onClick={() => {
                                setAssigningBranchUserId(u.id);
                                setAssignBranchId(branches[0]?.id ?? '');
                              }}
                            >
                              Assign branch
                            </button>
                          )}
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

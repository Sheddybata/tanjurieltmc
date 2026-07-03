'use client';



import { useEffect, useMemo, useState } from 'react';

import { Shield } from 'lucide-react';

import { DashboardLayout } from '@/components/layout/dashboard-layout';

import { Header } from '@/components/layout/header';

import { Card } from '@/components/ui/card';

import { Input } from '@/components/ui/input';

import { PageShell } from '@/components/ui/page-shell';

import { StatusBadge } from '@/components/ui/status-badge';

import { EmptyState } from '@/components/ui/empty-state';

import { SectionHeading } from '@/components/ui/section-heading';

import { api } from '@/lib/api';

import { formatDate } from '@/lib/utils';



interface AuditLog {

  id: string;

  action: string;

  entityType: string;

  entityId: string | null;

  createdAt: string;

  user: { firstName: string; lastName: string; email: string; role: string } | null;

}



export default function AuditPage() {

  const [logs, setLogs] = useState<AuditLog[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');



  useEffect(() => {

    api

      .get<{ success: boolean; data: AuditLog[] }>('/audit/logs?limit=50')

      .then((res) => setLogs(Array.isArray(res.data) ? res.data : []))

      .catch(() => setLogs([]))

      .finally(() => setLoading(false));

  }, []);



  const filtered = useMemo(() => {

    const q = search.trim().toLowerCase();

    if (!q) return logs;

    return logs.filter(

      (log) =>

        log.action.toLowerCase().includes(q) ||

        log.entityType.toLowerCase().includes(q) ||

        log.user?.email.toLowerCase().includes(q) ||

        `${log.user?.firstName} ${log.user?.lastName}`.toLowerCase().includes(q),

    );

  }, [logs, search]);



  return (

    <DashboardLayout>

      <Header title="Audit Logs" subtitle="Immutable record of staff actions across the platform" />

      <PageShell>

        <SectionHeading title="Activity trail" description="Most recent 50 events" />



        <div className="max-w-md">

          <Input

            label="Filter logs"

            placeholder="Search by user, action, or entity..."

            value={search}

            onChange={(e) => setSearch(e.target.value)}

          />

        </div>



        <Card className="overflow-hidden p-0">

          <div className="overflow-x-auto">

            <table className="data-table">

              <thead>

                <tr>

                  <th>When</th>

                  <th>User</th>

                  <th>Action</th>

                  <th>Entity</th>

                  <th>Reference</th>

                </tr>

              </thead>

              <tbody>

                {loading ? (

                  <tr>

                    <td colSpan={5} className="py-12 text-center text-gray-400">

                      Loading audit trail...

                    </td>

                  </tr>

                ) : filtered.length === 0 ? (

                  <tr>

                    <td colSpan={5} className="p-0">

                      <EmptyState icon={Shield} title="No logs found" description="Try adjusting your search or check back later." />

                    </td>

                  </tr>

                ) : (

                  filtered.map((log) => (

                    <tr key={log.id}>

                      <td className="whitespace-nowrap text-gray-500">{formatDate(log.createdAt)}</td>

                      <td>

                        <p className="font-medium text-gray-900">{log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}</p>

                        <p className="text-xs text-gray-400">{log.user?.role || '—'}</p>

                      </td>

                      <td><StatusBadge status={log.action} /></td>

                      <td className="text-gray-600">{log.entityType}</td>

                      <td className="font-mono text-xs text-gray-400">{log.entityId?.slice(0, 12) || '—'}</td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </Card>

      </PageShell>

    </DashboardLayout>

  );

}


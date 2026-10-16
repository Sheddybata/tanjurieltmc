'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

const NEEDS_DISBURSED_CONFIRM = new Set(['DISBURSED', 'ACTIVE', 'OVERDUE', 'CLOSED']);

interface Props {
  loanNumber: string;
  status: string;
  /** e.g. `/manager/loans/abc` or `/teller/loans/abc` */
  deleteEndpoint: string;
  redirectAfterDelete: string;
}

export function LoanDeletePanel({ loanNumber, status, deleteEndpoint, redirectAfterDelete }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [confirmDisbursed, setConfirmDisbursed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const needsConfirm = NEEDS_DISBURSED_CONFIRM.has(status);

  async function handleDelete() {
    if (reason.trim().length < 3) {
      setError('Enter a short reason (at least 3 characters).');
      return;
    }
    if (needsConfirm && !confirmDisbursed) {
      setError('Check the box to confirm deleting a disbursed loan and reversing the savings credit.');
      return;
    }
    const msg = needsConfirm
      ? `Delete ${loanNumber}? This removes the loan and reverses the disbursement amount on the member's Savings account. This cannot be undone.`
      : `Delete ${loanNumber}? This permanently removes the loan record.`;
    if (!window.confirm(msg)) return;

    setLoading(true);
    setError('');
    try {
      await api.delete(deleteEndpoint, {
        reason: reason.trim(),
        ...(needsConfirm ? { confirmDisbursed: true } : {}),
      });
      router.push(redirectAfterDelete);
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Could not delete loan');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-6 border-red-100 p-6">
      <h2 className="text-lg font-semibold text-red-800">Delete loan</h2>
      <p className="mt-2 text-sm text-gray-600">
        Use this to remove a duplicate or mistaken application. Deletion is permanent and is recorded in the audit log.
        {needsConfirm && (
          <>
            {' '}
            This loan is <strong>{status.replace(/_/g, ' ').toLowerCase()}</strong> — deleting it will also post a
            reversal on the linked Savings account for the disbursed principal (if any).
          </>
        )}
      </p>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      <div className="mt-4 max-w-md space-y-3">
        <Input
          label="Reason for deletion"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. Duplicate entry — keep LN-2024-0012"
          required
        />
        {needsConfirm && (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={confirmDisbursed}
              onChange={(e) => setConfirmDisbursed(e.target.checked)}
            />
            <span>
              I confirm this loan was disbursed in error. Reverse the disbursement credit and delete this loan record.
            </span>
          </label>
        )}
        <Button type="button" variant="danger" loading={loading} onClick={handleDelete}>
          Delete loan permanently
        </Button>
      </div>
    </Card>
  );
}

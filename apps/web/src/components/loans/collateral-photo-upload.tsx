'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast-provider';

type Props = {
  loanId: string;
  /** e.g. `/manager/loans` or `/teller/loans` */
  apiBasePath: string;
  onUpdated: () => void;
};

export function CollateralPhotoUpload({ loanId, apiBasePath, onUpdated }: Props) {
  const { showToast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function upload() {
    if (!file) {
      showToast('Choose a JPEG, PNG, or WebP photo first', 'error');
      return;
    }
    const form = new FormData();
    form.append('collateralPhoto', file, file.name);
    setLoading(true);
    try {
      await api.patch(`${apiBasePath}/${loanId}/collateral-photo`, form);
      showToast('Collateral photo saved', 'success');
      setFile(null);
      onUpdated();
    } catch (err: unknown) {
      showToast((err as { message?: string })?.message || 'Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4">
      <p className="mb-2 text-xs font-medium text-gray-600">
        {file ? 'Ready to upload' : 'Add or replace collateral photo'}
      </p>
      <p className="mb-3 text-xs text-gray-500">
        Use this if the original photo was lost during deployment. Pending approvals may need collateral
        verified again after you replace the photo.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="max-w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-700"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Button type="button" size="sm" loading={loading} disabled={!file} onClick={upload}>
          Save photo
        </Button>
      </div>
    </div>
  );
}

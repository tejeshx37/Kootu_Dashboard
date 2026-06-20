'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from './Toast';

export function MerchantApprovalRow({ id, name, category, city }: { id: number; name: string; category: string; city: string }) {
  const router = useRouter();
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  async function update(status: 'approved' | 'rejected') {
    setBusy(true);
    const res = await fetch(`/api/merchants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setBusy(false);
    if (res.ok) {
      show(`Merchant ${status}`);
      router.refresh();
    } else {
      show('Failed to update', 'error');
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <div className="text-sm font-medium text-slate-900">{name}</div>
        <div className="text-xs text-slate-500">{category} · {city}</div>
      </div>
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => update('approved')}
          className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={busy}
          onClick={() => update('rejected')}
          className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200 disabled:opacity-50"
        >
          Reject
        </button>
      </div>
    </div>
  );
}

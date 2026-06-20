'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import { AddMerchantModal } from './AddMerchantModal';
import { useToast } from './Toast';
import { cn } from '@/lib/utils';

type Merchant = {
  id: number;
  name: string;
  category: string;
  email: string;
  phone: string;
  city: string;
  status: string;
  _count?: { offers: number };
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'] as const;

export function MerchantsClient() {
  const router = useRouter();
  const { show } = useToast();
  const [items, setItems] = useState<Merchant[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter !== 'all') params.set('status', filter);
    if (search) params.set('search', search);
    const res = await fetch(`/api/merchants?${params}`, { cache: 'no-store' });
    if (res.ok) setItems(await res.json());
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/merchants/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      show(`Merchant ${status === 'pending' ? 'revoked' : status}`);
      load();
      router.refresh();
    } else {
      show('Update failed', 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name or city…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none md:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium capitalize',
                  filter === f ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add Merchant
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">City</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Offers</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-50">
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-4 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}
              {items && items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                    No merchants found.
                  </td>
                </tr>
              )}
              {items?.map((m) => (
                <tr key={m.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{m.name}</td>
                  <td className="px-4 py-3 text-slate-600">{m.category}</td>
                  <td className="px-4 py-3 text-slate-600">{m.city}</td>
                  <td className="px-4 py-3 text-slate-600">{m.email}</td>
                  <td className="px-4 py-3 text-slate-600">{m.phone}</td>
                  <td className="px-4 py-3 text-slate-600">{m._count?.offers ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge status={m.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {m.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(m.id, 'approved')} className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200">Approve</button>
                          <button onClick={() => updateStatus(m.id, 'rejected')} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200">Reject</button>
                        </>
                      )}
                      {m.status === 'approved' && (
                        <button onClick={() => updateStatus(m.id, 'pending')} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200">Revoke</button>
                      )}
                      {m.status === 'rejected' && (
                        <button onClick={() => updateStatus(m.id, 'pending')} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">Reopen</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddMerchantModal
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { StatusBadge } from './StatusBadge';
import { SourceBadge } from './SourceBadge';
import { AddOfferModal } from './AddOfferModal';
import { useToast } from './Toast';
import { cn } from '@/lib/utils';

type Offer = {
  id: number;
  title: string;
  discount: string;
  description: string;
  category: string;
  validUntil: string | null;
  status: string;
  source: string;
  sourceFileUrl: string | null;
  merchant: { id: number; name: string } | null;
};

type Filter = { label: string; status?: string; source?: string };
const FILTERS: Filter[] = [
  { label: 'All' },
  { label: 'Active', status: 'active' },
  { label: 'Pending', status: 'pending' },
  { label: 'Expired', status: 'expired' },
  { label: 'Rejected', status: 'rejected' },
  { label: 'AI Extracted', source: 'ai' },
];

export function OffersClient() {
  const router = useRouter();
  const { show } = useToast();
  const [items, setItems] = useState<Offer[] | null>(null);
  const [filter, setFilter] = useState<Filter>(FILTERS[0]);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (filter.status) params.set('status', filter.status);
    if (filter.source) params.set('source', filter.source);
    if (search) params.set('search', search);
    const res = await fetch(`/api/offers?${params}`, { cache: 'no-store' });
    if (res.ok) setItems(await res.json());
  }, [filter, search]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function updateStatus(id: number, status: string) {
    const res = await fetch(`/api/offers/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      show(`Offer ${status}`);
      load();
      router.refresh();
    } else {
      show('Update failed', 'error');
    }
  }

  async function remove(id: number) {
    if (!confirm('Delete this offer?')) return;
    const res = await fetch(`/api/offers/${id}`, { method: 'DELETE' });
    if (res.ok) {
      show('Offer deleted');
      load();
      router.refresh();
    } else {
      show('Delete failed', 'error');
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
            placeholder="Search title or merchant…"
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none md:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.label}
                onClick={() => setFilter(f)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium',
                  filter.label === f.label ? 'bg-primary text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          + Add Offer
        </button>
      </div>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Merchant</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Discount</th>
                <th className="px-4 py-3 font-medium">Valid Until</th>
                <th className="px-4 py-3 font-medium">Source</th>
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
                <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">No offers found.</td></tr>
              )}
              {items?.map((o) => (
                <tr key={o.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{o.title}</td>
                  <td className="px-4 py-3 text-slate-600">{o.merchant?.name || '—'}</td>
                  <td className="px-4 py-3 text-slate-600">{o.category}</td>
                  <td className="px-4 py-3 text-slate-600">{o.discount}</td>
                  <td className="px-4 py-3 text-slate-600">{o.validUntil || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <SourceBadge source={o.source} />
                      {o.sourceFileUrl && (
                        <a
                          href={o.sourceFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-primary hover:underline"
                          title="View original source"
                        >
                          📎
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      {o.status === 'pending' && (
                        <>
                          <button onClick={() => updateStatus(o.id, 'active')} className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800 hover:bg-green-200">Approve</button>
                          <button onClick={() => updateStatus(o.id, 'rejected')} className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 hover:bg-red-200">Reject</button>
                        </>
                      )}
                      {o.status === 'active' && (
                        <button onClick={() => updateStatus(o.id, 'expired')} className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-200">Deactivate</button>
                      )}
                      <button onClick={() => remove(o.id)} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-200">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAdd && (
        <AddOfferModal
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

'use client';

import { useEffect, useState } from 'react';
import { CATEGORIES } from '@/lib/utils';
import { useToast } from './Toast';

type Merchant = { id: number; name: string; status: string };

export function AddOfferModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { show } = useToast();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [title, setTitle] = useState('');
  const [merchantId, setMerchantId] = useState<string>('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [discount, setDiscount] = useState('');
  const [description, setDescription] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [address, setAddress] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch('/api/merchants?status=approved')
      .then((r) => r.json())
      .then((data) => {
        setMerchants(data);
        if (data?.[0]) setMerchantId(String(data[0].id));
      });
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !merchantId) return;
    setBusy(true);
    const res = await fetch('/api/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        merchantId: Number(merchantId),
        category,
        discount,
        description,
        validUntil: validUntil || null,
        address: address || null,
        status: 'pending',
        source: 'manual',
      }),
    });
    setBusy(false);
    if (res.ok) {
      show('Offer added');
      onCreated();
    } else {
      show('Failed to add offer', 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Offer</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Title*">
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Merchant*">
            <select required value={merchantId} onChange={(e) => setMerchantId(e.target.value)} className={inputCls}>
              <option value="">Select merchant</option>
              {merchants.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {merchants.length === 0 && (
              <p className="mt-1 text-xs text-amber-700">No approved merchants yet. Approve one first.</p>
            )}
          </Field>
          <Field label="Category">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Discount">
            <input value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="50% off" className={inputCls} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputCls} />
          </Field>
          <Field label="Valid Until">
            <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Address">
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="Shop address (server will geocode)"
              className={inputCls}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Adding…' : 'Add Offer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600">{label}</label>
      {children}
    </div>
  );
}

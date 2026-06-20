'use client';

import { useState } from 'react';
import { CATEGORIES } from '@/lib/utils';
import { useToast } from './Toast';

export function AddMerchantModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { show } = useToast();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const res = await fetch('/api/merchants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, category, email, phone, city }),
    });
    setBusy(false);
    if (res.ok) {
      show('Merchant added');
      onCreated();
    } else {
      const data = await res.json().catch(() => ({}));
      show(data?.error || 'Failed to add merchant', 'error');
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Add Merchant</h2>
        <form onSubmit={submit} className="space-y-3">
          <Field label="Business Name*">
            <input required value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Category*">
            <select value={category} onChange={(e) => setCategory(e.target.value as any)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Email*">
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
          </Field>
          <Field label="Phone">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
          </Field>
          <Field label="City*">
            <input required value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
            <button disabled={busy} className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60">{busy ? 'Adding…' : 'Add Merchant'}</button>
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

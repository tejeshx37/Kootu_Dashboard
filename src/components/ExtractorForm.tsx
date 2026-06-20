'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useToast } from './Toast';

type Tab = 'url' | 'text' | 'file' | 'image';

const IMAGE_MIME_PREFIX = 'image/';
const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
function isImageFile(f: File | null): boolean {
  if (!f) return false;
  if (f.type.startsWith(IMAGE_MIME_PREFIX)) return true;
  const name = f.name.toLowerCase();
  return IMAGE_EXT.some((e) => name.endsWith(e));
}
type Extracted = {
  title: string;
  merchant: string;
  discount: string;
  description: string;
  validUntil: string;
  category: string;
};

export function ExtractorForm() {
  const router = useRouter();
  const { show } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>('url');
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Extracted[] | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [adding, setAdding] = useState(false);
  // Snapshot of the source the user actually ran extraction against, so the
  // upload-to-Firebase step uses that exact file even if they swap tabs.
  const [extractedSource, setExtractedSource] = useState<
    { sourceType: 'url' | 'text' | 'pdf' | 'docx' | 'image'; file?: File } | null
  >(null);

  async function extract() {
    setError(null);
    setResults(null);
    setLoading(true);
    try {
      const resolvedType: 'url' | 'text' | 'pdf' | 'docx' | 'image' =
        tab === 'file' ? (file?.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'docx') : tab;
      const form = new FormData();
      form.set('sourceType', resolvedType);
      if (tab === 'url') form.set('content', url);
      else if (tab === 'text') form.set('content', text);
      else if (tab === 'file' && file) form.set('file', file);
      else if (tab === 'image' && image) form.set('file', image);

      const res = await fetch('/api/extract', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Extraction failed');
      const offers: Extracted[] = data.offers || [];
      setResults(offers);
      setSelected(new Set(offers.map((_, i) => i)));
      setExtractedSource({
        sourceType: resolvedType,
        file: tab === 'file' ? file ?? undefined : tab === 'image' ? image ?? undefined : undefined,
      });
      if (offers.length === 0) setError('No offers found in the provided content.');
    } catch (err: any) {
      setError(err?.message || 'Extraction failed');
    } finally {
      setLoading(false);
    }
  }

  function toggle(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  async function addSelected() {
    if (!results) return;
    setAdding(true);
    const picks = results.filter((_, i) => selected.has(i));
    const payload = picks.map((o) => ({
      title: o.title || 'Untitled offer',
      discount: o.discount,
      description: o.description,
      category: o.category || 'Shopping',
      validUntil: o.validUntil || null,
      merchantName: o.merchant,
    }));
    const form = new FormData();
    form.set('offers', JSON.stringify(payload));
    form.set('sourceType', extractedSource?.sourceType || '');
    if (extractedSource?.file) form.set('file', extractedSource.file);
    await fetch('/api/offers/from-ai', { method: 'POST', body: form });
    setAdding(false);
    show(`Added ${picks.length} offer${picks.length === 1 ? '' : 's'} for review`);
    router.push('/offers');
    router.refresh();
  }

  const canSubmit =
    !loading &&
    ((tab === 'url' && url.trim().length > 0) ||
      (tab === 'text' && text.trim().length > 0) ||
      (tab === 'file' && !!file) ||
      (tab === 'image' && !!image));

  function pickImage(f: File | null) {
    if (!isImageFile(f)) {
      setImage(null);
      setImagePreview(null);
      if (f) setError('Please choose an image file (JPG, PNG, WEBP, or GIF).');
      return;
    }
    setImage(f);
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(typeof reader.result === 'string' ? reader.result : null);
    reader.readAsDataURL(f!);
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1">
          {(['url', 'text', 'file', 'image'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'flex-1 rounded-md px-3 py-1.5 text-sm font-medium capitalize transition',
                tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              )}
            >
              {t === 'url' ? 'URL' : t === 'text' ? 'Text' : t === 'file' ? 'File' : 'Image'}
            </button>
          ))}
        </div>

        {tab === 'url' && (
          <div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Newspaper or website URL"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">
              Gemini will read the page contents and extract all offers from it.
            </p>
          </div>
        )}

        {tab === 'text' && (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="Paste offer content, newsletter, or ad copy here."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}

        {tab === 'file' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) setFile(f);
            }}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-primary"
          >
            <span className="text-2xl">📄</span>
            <p className="text-sm font-medium text-slate-700">
              {file ? file.name : 'Drag & drop a PDF or DOCX, or click to browse'}
            </p>
            <p className="text-xs text-slate-500">Accepts .pdf and .docx</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {tab === 'image' && (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              pickImage(e.dataTransfer.files?.[0] ?? null);
            }}
            onClick={() => imageInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-primary"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview" className="max-h-64 rounded-md object-contain" />
            ) : (
              <span className="text-2xl">🖼️</span>
            )}
            <p className="text-sm font-medium text-slate-700">
              {image ? image.name : 'Drag & drop a poster image, or click to browse'}
            </p>
            <p className="text-xs text-slate-500">Accepts .jpg, .png, .webp, .gif</p>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        <button
          onClick={extract}
          disabled={!canSubmit}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Extracting…
            </>
          ) : (
            'Extract Offers'
          )}
        </button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {results && results.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">
              Found {results.length} offer{results.length === 1 ? '' : 's'} — select which to add
            </h2>
            <div className="flex gap-3 text-xs">
              <button onClick={() => setSelected(new Set(results.map((_, i) => i)))} className="text-primary hover:underline">Select All</button>
              <button onClick={() => setSelected(new Set())} className="text-slate-500 hover:underline">Deselect All</button>
            </div>
          </div>

          <div className="max-h-[480px] space-y-3 overflow-y-auto pr-1">
            {results.map((o, i) => (
              <label
                key={i}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-lg border p-3 transition',
                  selected.has(i) ? 'border-primary bg-indigo-50/40' : 'border-slate-200 bg-white'
                )}
              >
                <input
                  type="checkbox"
                  checked={selected.has(i)}
                  onChange={() => toggle(i)}
                  className="mt-1 h-4 w-4 accent-indigo-600"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">{o.title || 'Untitled offer'}</span>
                    {o.merchant && <span className="text-xs text-slate-500">· {o.merchant}</span>}
                    {o.discount && (
                      <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                        {o.discount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-600">{o.description}</p>
                  <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-500">
                    {o.category && <span>📂 {o.category}</span>}
                    {o.validUntil && <span>⏰ {o.validUntil}</span>}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <button
            onClick={addSelected}
            disabled={adding || selected.size === 0}
            className="mt-4 w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            {adding ? 'Adding…' : `Add ${selected.size} Selected Offer${selected.size === 1 ? '' : 's'} for Review`}
          </button>
        </div>
      )}
    </div>
  );
}

import { ExtractorForm } from '@/components/ExtractorForm';

export default function ExtractorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Offer Extractor</h1>
        <p className="text-sm text-slate-500">Paste a URL, text, or upload a PDF/DOCX. Gemini 2.5 Flash pulls out every offer.</p>
      </div>
      <ExtractorForm />
    </div>
  );
}

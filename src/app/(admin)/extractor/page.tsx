import { ExtractorForm } from '@/components/ExtractorForm';

export default function ExtractorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">AI Offer Extractor</h1>
        <p className="text-sm text-slate-500">Paste a URL, text, or upload a PDF/DOCX. Claude pulls out every offer.</p>
      </div>
      <ExtractorForm />
    </div>
  );
}

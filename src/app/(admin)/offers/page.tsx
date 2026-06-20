import { OffersClient } from '@/components/OffersClient';

export const dynamic = 'force-dynamic';

export default function OffersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Offers</h1>
        <p className="text-sm text-slate-500">Review, approve, and manage all offers.</p>
      </div>
      <OffersClient />
    </div>
  );
}

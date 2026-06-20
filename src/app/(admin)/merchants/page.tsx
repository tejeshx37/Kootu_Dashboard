import { MerchantsClient } from '@/components/MerchantsClient';

export const dynamic = 'force-dynamic';

export default function MerchantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Merchants</h1>
        <p className="text-sm text-slate-500">Manage merchant onboarding and approvals.</p>
      </div>
      <MerchantsClient />
    </div>
  );
}

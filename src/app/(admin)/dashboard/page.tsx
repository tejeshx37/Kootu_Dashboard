import { prisma } from '@/lib/prisma';
import { StatusBadge } from '@/components/StatusBadge';
import { formatDate } from '@/lib/utils';
import { MerchantApprovalRow } from '@/components/MerchantApprovalRow';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [totalOffers, activeOffers, pendingOffers, pendingMerchants, recentOffers, pendingMerchantList] = await Promise.all([
    prisma.offer.count(),
    prisma.offer.count({ where: { status: 'active' } }),
    prisma.offer.count({ where: { status: 'pending' } }),
    prisma.merchant.count({ where: { status: 'pending' } }),
    prisma.offer.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { merchant: { select: { name: true } } },
    }),
    prisma.merchant.findMany({ where: { status: 'pending' }, orderBy: { createdAt: 'desc' } }),
  ]);

  const stats = [
    { label: 'Total Offers', value: totalOffers, color: 'bg-blue-50 text-blue-700', accent: 'bg-blue-500' },
    { label: 'Active Offers', value: activeOffers, color: 'bg-green-50 text-green-700', accent: 'bg-green-500' },
    { label: 'Pending Review', value: pendingOffers, color: 'bg-amber-50 text-amber-700', accent: 'bg-amber-500' },
    { label: 'Merchants Pending', value: pendingMerchants, color: 'bg-red-50 text-red-700', accent: 'bg-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Live overview of the Kootu offers platform.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-medium uppercase text-slate-500">{s.label}</div>
                <div className="mt-2 text-3xl font-semibold text-slate-900">{s.value}</div>
              </div>
              <div className={`h-2 w-2 rounded-full ${s.accent}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent Offers</h2>
            <span className="text-xs text-slate-500">Last 5</span>
          </div>
          <div className="divide-y divide-slate-100">
            {recentOffers.length === 0 && <p className="text-sm text-slate-500">No offers yet.</p>}
            {recentOffers.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-slate-900">{o.title}</div>
                  <div className="text-xs text-slate-500">{o.merchant?.name ?? '—'} · {formatDate(o.createdAt)}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Merchant Approvals</h2>
            <span className="text-xs text-slate-500">{pendingMerchantList.length} pending</span>
          </div>
          <div className="divide-y divide-slate-100">
            {pendingMerchantList.length === 0 && (
              <p className="text-sm text-slate-500">No merchants awaiting review.</p>
            )}
            {pendingMerchantList.map((m) => (
              <MerchantApprovalRow key={m.id} id={m.id} name={m.name} category={m.category} city={m.city} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

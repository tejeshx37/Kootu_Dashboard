import { Sidebar } from '@/components/Sidebar';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const [pendingOffers, pendingMerchants] = await Promise.all([
    prisma.offer.count({ where: { status: 'pending' } }),
    prisma.merchant.count({ where: { status: 'pending' } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <Sidebar pendingOffers={pendingOffers} pendingMerchants={pendingMerchants} />
      <main className="flex-1 bg-pagebg p-4 md:p-8">{children}</main>
    </div>
  );
}

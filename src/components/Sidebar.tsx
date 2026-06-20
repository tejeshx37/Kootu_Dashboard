'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

type Props = { pendingOffers: number; pendingMerchants: number };

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊', key: 'dashboard' as const },
  { href: '/extractor', label: 'AI Extractor', icon: '✨', key: 'extractor' as const },
  { href: '/offers', label: 'Offers', icon: '🏷️', key: 'offers' as const },
  { href: '/merchants', label: 'Merchants', icon: '🏪', key: 'merchants' as const },
];

export function Sidebar({ pendingOffers, pendingMerchants }: Props) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const links = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map((item) => {
        const active = pathname?.startsWith(item.href);
        let badge: React.ReactNode = null;
        if (item.key === 'extractor') {
          badge = (
            <span className="ml-auto rounded-full bg-[#7C3AED] px-2 py-0.5 text-[10px] font-bold uppercase text-white">
              AI
            </span>
          );
        } else if (item.key === 'offers' && pendingOffers > 0) {
          badge = (
            <span className="ml-auto rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {pendingOffers}
            </span>
          );
        } else if (item.key === 'merchants' && pendingMerchants > 0) {
          badge = (
            <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {pendingMerchants}
            </span>
          );
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-activenav text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            )}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
            {badge}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between bg-sidebar px-4 py-3 md:hidden">
        <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold text-logo">K</span>
          <span className="text-sm font-semibold text-white">Kootu</span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="rounded-md p-2 text-slate-300 hover:bg-slate-800 hover:text-white"
          aria-label="Toggle menu"
        >
          ☰
        </button>
      </div>

      {/* Sidebar (desktop) + drawer (mobile) */}
      <aside
        className={cn(
          'bg-sidebar text-white md:flex md:w-64 md:flex-col md:py-6',
          open ? 'flex w-full flex-col py-4' : 'hidden md:flex'
        )}
      >
        <div className="hidden items-center gap-2 px-6 pb-6 md:flex">
          <span className="text-3xl font-extrabold text-logo">K</span>
          <div>
            <div className="text-lg font-semibold text-white">Kootu</div>
            <div className="text-xs text-slate-400">Admin Console</div>
          </div>
        </div>
        {links}
        <div className="mt-auto px-3 pt-4">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <span>↩️</span>
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

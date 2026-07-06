'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Landmark, Lock, Menu, X, ChevronDown, Smartphone } from 'lucide-react';
import { SITE, NAV } from '@/lib/site-content';
import { staffPortalUrl } from '@/lib/domains';
import { cn } from '@/lib/utils';

const staffLoginUrl = staffPortalUrl('/staff/login');

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href.split('#')[0]);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-gray-900">{SITE.shortName}</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.main.map((item) =>
            item.hasDropdown ? (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition',
                    isActive(item.href) ? 'text-brand-700' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  {item.label}
                  <ChevronDown className="h-3.5 w-3.5 opacity-60" />
                </Link>
                {openDropdown === item.label && (
                  <div className="absolute left-0 top-full pt-1">
                    <div className="min-w-[200px] rounded-xl border border-gray-100 bg-white py-2 shadow-elevated">
                      {(item.label === 'Personal' ? NAV.personal : NAV.about).map((sub) => (
                        <Link
                          key={sub.href}
                          href={sub.href}
                          className="block px-4 py-2 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition',
                  isActive(item.href) ? 'text-brand-700' : 'text-gray-600 hover:text-gray-900',
                )}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            <Smartphone className="h-4 w-4" />
            Download App
          </Link>
          <Link
            href={staffLoginUrl}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 transition hover:border-gray-300 hover:text-gray-700"
          >
            <Lock className="h-3.5 w-3.5" />
            Staff Login
          </Link>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-gray-600 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white px-4 py-4 lg:hidden">
          <div className="space-y-1">
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-50',
                pathname === '/' ? 'text-brand-700' : 'text-gray-700',
              )}
            >
              Home
            </Link>
            <p className="mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Personal</p>
            {NAV.personal.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50"
              >
                {item.label}
              </Link>
            ))}
            <p className="mt-3 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">About</p>
            {NAV.about.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/business"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50"
            >
              Business
            </Link>
            <Link
              href="/support"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-brand-50"
            >
              Support
            </Link>
          </div>
          <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
            <Link
              href="/app"
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white"
            >
              <Smartphone className="h-4 w-4" />
              Download App
            </Link>
            <Link
              href={staffLoginUrl}
              onClick={() => setMobileOpen(false)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600"
            >
              <Lock className="h-4 w-4" />
              Staff Login
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

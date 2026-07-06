import Link from 'next/link';
import { Landmark, Lock } from 'lucide-react';
import { SITE, NAV } from '@/lib/site-content';
import { staffPortalUrl } from '@/lib/domains';

export function PublicFooter() {
  return (
    <footer className="border-t border-gray-100 bg-brand-950 text-brand-100">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Landmark className="h-5 w-5 text-white" />
              </div>
              <span className="font-display text-lg font-bold text-white">{SITE.shortName}</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-brand-200">{SITE.description}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Personal</h3>
            <ul className="mt-4 space-y-2">
              {NAV.personal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-brand-200 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Company</h3>
            <ul className="mt-4 space-y-2">
              {NAV.about.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-sm text-brand-200 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/business" className="text-sm text-brand-200 transition hover:text-white">
                  Business Banking
                </Link>
              </li>
              <li>
                <Link href="/app" className="text-sm text-brand-200 transition hover:text-white">
                  Download App
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-white">Support</h3>
            <ul className="mt-4 space-y-2">
              <li>
                <Link href="/support" className="text-sm text-brand-200 transition hover:text-white">
                  Help & FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-brand-200 transition hover:text-white">
                  Contact Us
                </Link>
              </li>
              <li>
                <a href={`mailto:${SITE.email}`} className="text-sm text-brand-200 transition hover:text-white">
                  {SITE.email}
                </a>
              </li>
              <li>
                <a href={`tel:${SITE.phone.replace(/\s/g, '')}`} className="text-sm text-brand-200 transition hover:text-white">
                  {SITE.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-brand-300">&copy; {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <Link
            href={staffPortalUrl()}
            className="inline-flex items-center gap-1.5 text-sm text-brand-400 transition hover:text-white"
          >
            <Lock className="h-3.5 w-3.5" />
            Staff portal
          </Link>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHero } from '@/components/public/page-hero';
import { SITE, FAQ } from '@/lib/site-content';

export const metadata: Metadata = {
  title: `Support | ${SITE.name}`,
  description: 'Help, FAQs, and support for Tanjuriel savings, loans, and mobile app.',
};

export default function SupportPage() {
  return (
    <>
      <PageHero
        eyebrow="Help centre"
        title="How can we help?"
        description="Find answers about Daily Savings, Child Savings, loans, and the mobile app."
        compact
      />

      <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-gray-100 bg-white shadow-card open:shadow-elevated"
            >
              <summary className="cursor-pointer list-none px-6 py-5 font-semibold text-gray-900 marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.q}
                  <span className="text-brand-500 transition group-open:rotate-45">+</span>
                </span>
              </summary>
              <div className="border-t border-gray-50 px-6 pb-5 pt-2 text-sm leading-relaxed text-gray-600">
                {item.a}
              </div>
            </details>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-surface-secondary p-8 text-center">
          <h2 className="font-display text-xl font-bold text-gray-900">Still need help?</h2>
          <p className="mt-2 text-sm text-gray-600">Our team is ready to assist you.</p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}

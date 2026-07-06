import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { SITE, VALUES } from '@/lib/site-content';

export const metadata: Metadata = {
  title: `About Us | ${SITE.name}`,
  description: `Learn about ${SITE.name} — our story, values, and commitment to accessible financial services.`,
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About us"
        title="Built for the communities we serve"
        description="Tanjuriel Microfinance exists to give everyday Nigerians — traders, artisans, parents, and small business owners — a financial partner they can trust."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">Our story</h2>
            <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
              <p>
                Tanjuriel was founded on a simple belief: financial services should work for everyone, not just those
                who already have access to traditional banking.
              </p>
              <p>
                We saw market women saving small amounts daily, parents putting aside money for their children&apos;s
                school fees, and small business owners needing working capital without complicated processes. So we built
                products like Daily Savings and My Pikin Savings — accounts that match how people actually live and save.
              </p>
              <p>
                Today, Tanjuriel combines branch service with a modern mobile app, giving customers the flexibility to
                save, borrow, and manage their money on their terms.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-surface-secondary p-8 lg:p-10">
            <h3 className="font-display text-xl font-bold text-gray-900">What we offer</h3>
            <ul className="mt-6 space-y-4">
              {[
                'Daily Savings — save little by little, every day',
                'My Pikin Savings — secure savings for your child\'s future',
                'Personal and SME loans with clear terms',
                'Mobile app for balances, transfers, and bills',
                'Friendly branch support when you need a person',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/about/mission-vision"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              Read our mission & vision
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-surface-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-2xl font-bold text-gray-900">Our values</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
                <h3 className="font-display text-lg font-bold text-gray-900">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

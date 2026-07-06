import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Users, Wallet, MessageCircle } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { SITE, BUSINESS_SERVICES, LOAN_PRODUCTS } from '@/lib/site-content';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: `Business Banking | ${SITE.name}`,
  description: 'SME working capital, business savings, and dedicated support for small businesses and cooperatives.',
};

const serviceIcons = [Wallet, Building2, Users, MessageCircle];

export default function BusinessPage() {
  const smeLoan = LOAN_PRODUCTS.find((l) => l.code === 'SME-001');

  return (
    <>
      <PageHero
        eyebrow="Business banking"
        title="Grow your business with Tanjuriel"
        description="From working capital loans to group savings support — we help SMEs, market traders, and cooperatives manage cash flow and plan ahead."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          {BUSINESS_SERVICES.map((service, i) => {
            const Icon = serviceIcons[i] ?? Building2;
            return (
              <div key={service.title} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-600" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold text-gray-900">{service.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{service.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {smeLoan && (
        <section className="bg-surface-secondary py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card lg:p-10">
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Featured product</p>
              <h2 className="mt-2 font-display text-2xl font-bold text-gray-900">{smeLoan.name}</h2>
              <p className="mt-3 max-w-2xl text-gray-600">{smeLoan.description}</p>
              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-gray-500">Loan range</p>
                  <p className="font-semibold text-gray-900">
                    {formatCurrency(smeLoan.minAmount)} – {formatCurrency(smeLoan.maxAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Tenure</p>
                  <p className="font-semibold text-gray-900">
                    {smeLoan.minTenureMonths}–{smeLoan.maxTenureMonths} months
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Monthly rate</p>
                  <p className="font-semibold text-gray-900">{(smeLoan.interestRate * 100).toFixed(1)}%</p>
                </div>
              </div>
              <Link
                href="/personal/loans"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
              >
                View loan details
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-brand-950 px-8 py-10 text-center lg:px-14">
          <h2 className="font-display text-2xl font-bold text-white">Talk to our business team</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-200">
            Tell us about your business and we&apos;ll help you find the right product.
          </p>
          <Link
            href="/contact"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50"
          >
            Get in touch
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

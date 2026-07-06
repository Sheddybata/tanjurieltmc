import type { Metadata } from 'next';
import Link from 'next/link';
import { CalendarHeart, Baby, Check, ArrowRight, Smartphone } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { SavingsProductCard } from '@/components/public/savings-product-card';
import { SITE, SAVINGS_PRODUCTS } from '@/lib/site-content';

export const metadata: Metadata = {
  title: `Savings | ${SITE.name}`,
  description: 'Daily Savings and My Pikin Savings — two savings products built for Nigerian families and daily earners.',
};

const accentIcons = {
  'daily-savings': CalendarHeart,
  'my-pikin': Baby,
};

export default function SavingsPage() {
  return (
    <>
      <PageHero
        eyebrow="Personal banking"
        title="Savings that fit your life"
        description="Whether you save every day or plan years ahead for your child, Tanjuriel has an account designed for you."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {SAVINGS_PRODUCTS.map((product, i) => (
            <SavingsProductCard key={product.id} {...product} featured={i === 0} />
          ))}
        </div>
      </section>

      {SAVINGS_PRODUCTS.map((product) => {
        const Icon = accentIcons[product.id as keyof typeof accentIcons] ?? CalendarHeart;
        return (
          <section
            key={product.id}
            id={product.id}
            className="scroll-mt-24 border-t border-gray-100 bg-surface-secondary py-16"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
                    <Icon className="h-6 w-6 text-brand-700" />
                  </div>
                  <h2 className="mt-5 font-display text-3xl font-bold text-gray-900">{product.name}</h2>
                  <p className="mt-2 text-lg font-medium text-brand-600">{product.headline}</p>
                  <p className="mt-4 leading-relaxed text-gray-600">{product.description}</p>
                  <p className="mt-4 text-sm text-gray-500">
                    <span className="font-semibold text-gray-700">Best for:</span> {product.idealFor}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
                  <h3 className="font-display text-lg font-bold text-gray-900">What you get</h3>
                  <ul className="mt-6 space-y-3">
                    {product.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {product.id === 'my-pikin' && (
                    <div className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      My Pikin funds are locked until maturity. Withdrawals are branch-only after maturity, with manager approval.
                    </div>
                  )}

                  {product.id === 'daily-savings' && (
                    <div className="mt-6 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      Transfers and withdrawals require manager approval — keeping your savings secure.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        );
      })}

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-brand-950 px-8 py-10 text-center lg:px-14">
          <Smartphone className="mx-auto h-10 w-10 text-brand-300" />
          <h2 className="mt-4 font-display text-2xl font-bold text-white">Ready to start saving?</h2>
          <p className="mx-auto mt-3 max-w-md text-brand-200">
            Open an account at any branch or download the app to get started.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-900 hover:bg-brand-50"
            >
              Download App
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Find a branch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

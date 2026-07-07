import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Smartphone } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { SavingsProductCard } from '@/components/public/savings-product-card';
import { SITE, SAVINGS_PRODUCTS } from '@/lib/site-content';

export const metadata: Metadata = {
  title: `Savings | ${SITE.name}`,
  description: 'Daily Savings and Child Savings — two savings products built for Nigerian families and daily earners.',
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

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
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

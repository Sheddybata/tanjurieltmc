import Link from 'next/link';
import Image from 'next/image';
import { Check, ArrowRight } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';

export interface SavingsProduct {
  id: string;
  name: string;
  slug: string;
  headline: string;
  summary: string;
  description: string;
  features: string[];
  idealFor: string;
  accent: 'emerald' | 'amber';
  image: string;
}

interface SavingsProductDetailProps {
  product: SavingsProduct;
  otherProduct?: SavingsProduct;
}

export function SavingsProductDetail({ product, otherProduct }: SavingsProductDetailProps) {
  const notice =
    product.id === 'child-savings'
      ? 'Child Savings funds are locked until maturity. Withdrawals are branch-only after maturity, with manager approval.'
      : 'Transfers and withdrawals require manager approval — keeping your savings secure.';

  const noticeStyle =
    product.accent === 'amber'
      ? 'bg-amber-50 text-amber-800'
      : 'bg-emerald-50 text-emerald-800';

  return (
    <>
      <PageHero
        eyebrow="Personal banking"
        title={product.name}
        description={product.headline}
        compact
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <div>
            <div className="relative h-64 overflow-hidden rounded-2xl shadow-card sm:h-72">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>

            <h2 className="mt-8 font-display text-3xl font-bold text-gray-900">{product.name}</h2>
            <p className="mt-2 text-lg font-medium text-brand-600">{product.headline}</p>
            <p className="mt-4 leading-relaxed text-gray-600">{product.description}</p>
            <p className="mt-6 text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Best for:</span> {product.idealFor}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card lg:p-10">
            <h3 className="font-display text-xl font-bold text-gray-900">What you get</h3>
            <ul className="mt-6 space-y-3">
              {product.features.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <div className={`mt-6 rounded-lg px-4 py-3 text-sm ${noticeStyle}`}>{notice}</div>
          </div>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-surface-secondary py-12">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Get started</p>
            <p className="mt-1 text-gray-600">Open an account at a branch or download the app.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Download App
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Find a branch
            </Link>
          </div>
        </div>
      </section>

      {otherProduct && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">Also explore</p>
          <Link
            href={`/personal/savings/${otherProduct.slug}`}
            className="mt-2 inline-flex items-center gap-2 font-display text-lg font-bold text-brand-700 hover:text-brand-800"
          >
            {otherProduct.name}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <Link
          href="/personal/savings"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-brand-700"
        >
          ← All savings products
        </Link>
      </section>
    </>
  );
}

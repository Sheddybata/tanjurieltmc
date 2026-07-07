import Link from 'next/link';
import {
  ArrowRight,
  Smartphone,
  Shield,
  Users,
  TrendingUp,
  Heart,
  Building2,
  Wallet,
} from 'lucide-react';
import { SavingsProductCard } from '@/components/public/savings-product-card';
import { SITE, SAVINGS_PRODUCTS, LOAN_PRODUCTS, VALUES, HOMEPAGE_STATS, MISSION_VISION } from '@/lib/site-content';
import { formatCurrency } from '@/lib/utils';

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-500/20 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-300">
              Welcome to {SITE.shortName}
            </p>
            <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {SITE.tagline}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-brand-100">
              Save daily, plan for your pikin&apos;s future, borrow for your business, and manage it all from our mobile app.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/personal/savings"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-800 shadow-lg transition hover:bg-brand-50"
              >
                Explore Savings
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                <Smartphone className="h-4 w-4" />
                Download App
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {HOMEPAGE_STATS.map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white/5 px-6 py-5 backdrop-blur">
                <p className="font-display text-3xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 text-sm text-brand-200">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our story */}
      <section className="bg-surface-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Our story</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
                Built for the communities we serve
              </h2>
              <div className="mt-6 space-y-4 leading-relaxed text-gray-600">
                <p>
                  Tanjuriel was founded on a simple belief: financial services should work for everyone, not just those
                  who already have access to traditional banking.
                </p>
                <p>
                  We saw market women saving small amounts daily, parents putting aside money for their children&apos;s
                  school fees, and small business owners needing working capital without complicated processes. So we built
                  products like Daily Savings and Child Savings — accounts that match how people actually live and save.
                </p>
                <p>
                  Today, Tanjuriel combines branch service with a modern mobile app, giving customers the flexibility to
                  save, borrow, and manage their money on their terms.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card lg:p-10">
              <h3 className="font-display text-xl font-bold text-gray-900">What we offer</h3>
              <ul className="mt-6 space-y-4">
                {[
                  'Daily Savings — save little by little, every day',
                  'Child Savings — secure savings for your child\'s future',
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
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-brand-100 bg-brand-50 p-8 lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Mission</p>
            <p className="mt-4 font-display text-xl font-bold leading-relaxed text-gray-900">
              {MISSION_VISION.mission}
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card lg:p-10">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Vision</p>
            <p className="mt-4 font-display text-xl font-bold leading-relaxed text-gray-900">
              {MISSION_VISION.vision}
            </p>
          </div>
        </div>
      </section>

      {/* Savings highlight */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Our Savings</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-gray-900 sm:text-4xl">
            Two products. Built for how you live.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Whether you save every day at the market or lock funds away for your child&apos;s future, we have an account for you.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {SAVINGS_PRODUCTS.map((product, i) => (
            <SavingsProductCard key={product.id} {...product} featured={i === 0} />
          ))}
        </div>
      </section>

      {/* Loans snapshot */}
      <section className="bg-surface-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Loans</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-gray-900">Borrow with clarity</h2>
              <p className="mt-3 max-w-xl text-gray-600">
                Personal and business loans with transparent terms. Visit a branch or apply through the app.
              </p>
            </div>
            <Link
              href="/personal/loans"
              className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
            >
              View all loan products
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {LOAN_PRODUCTS.map((loan) => (
              <div key={loan.code} className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <Wallet className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="mt-4 font-display text-xl font-bold text-gray-900">{loan.name}</h3>
                <p className="mt-2 text-sm text-gray-600">{loan.description}</p>
                <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Amount range</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(loan.minAmount)} – {formatCurrency(loan.maxAmount)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Monthly rate</p>
                    <p className="font-semibold text-gray-900">{(loan.interestRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Business teaser */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl bg-brand-950">
          <div className="grid lg:grid-cols-2">
            <div className="p-8 lg:p-12">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold text-white">Support for your business</h2>
              <p className="mt-4 text-brand-200">
                Working capital loans, business savings, and dedicated support for SMEs, market traders, and cooperatives.
              </p>
              <Link
                href="/business"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition hover:bg-brand-50"
              >
                Business banking
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-px bg-white/10">
              {['SME loans', 'Business savings', 'Group support', 'Dedicated team'].map((item) => (
                <div key={item} className="flex items-center justify-center bg-brand-900/50 p-6 text-center">
                  <p className="text-sm font-medium text-brand-100">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Tanjuriel */}
      <section className="bg-surface-secondary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-600">Why Tanjuriel</p>
            <h2 className="mt-2 font-display text-3xl font-bold text-gray-900">Banking that puts people first</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, i) => {
              const icons = [Users, Shield, Heart, TrendingUp];
              const Icon = icons[i] ?? Users;
              return (
                <div key={value.title} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold text-gray-900">{value.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* App CTA */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 text-center lg:p-14">
          <Smartphone className="mx-auto h-12 w-12 text-brand-600" />
          <h2 className="mt-6 font-display text-3xl font-bold text-gray-900">Bank from your phone</h2>
          <p className="mx-auto mt-4 max-w-lg text-gray-600">
            Check balances, save daily, apply for loans, and pay bills — all in the Tanjuriel mobile app.
          </p>
          <Link
            href="/app"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-700"
          >
            Get the app
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Wallet, Clock, Shield } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { SITE, LOAN_PRODUCTS } from '@/lib/site-content';
import { formatCurrency } from '@/lib/utils';

export const metadata: Metadata = {
  title: `Loans | ${SITE.name}`,
  description: 'Personal micro loans and SME working capital — transparent terms, structured repayment.',
};

export default function LoansPage() {
  return (
    <>
      <PageHero
        eyebrow="Personal & business loans"
        title="Borrow with confidence"
        description="Whether you need funds for personal use or to grow your business, our loan products come with clear terms and a guided approval process."
        compact
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8">
          {LOAN_PRODUCTS.map((loan) => (
            <article
              key={loan.code}
              className="rounded-2xl border border-gray-100 bg-white p-8 shadow-card lg:p-10"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex-1">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                    <Wallet className="h-5 w-5 text-brand-600" />
                  </div>
                  <h2 className="mt-4 font-display text-2xl font-bold text-gray-900">{loan.name}</h2>
                  <p className="mt-2 max-w-xl text-gray-600">{loan.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
                  <div className="rounded-xl bg-surface-secondary p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Min amount</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(loan.minAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-secondary p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Max amount</p>
                    <p className="mt-1 font-semibold text-gray-900">{formatCurrency(loan.maxAmount)}</p>
                  </div>
                  <div className="rounded-xl bg-surface-secondary p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Tenure</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {loan.minTenureMonths}–{loan.maxTenureMonths} months
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-secondary p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Monthly rate</p>
                    <p className="mt-1 font-semibold text-gray-900">{(loan.interestRate * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>

              {loan.requiresCollateral && (
                <p className="mt-6 text-sm text-gray-500">
                  Collateral or guarantor may be required. Our team will explain options during your application.
                </p>
              )}
            </article>
          ))}
        </div>
      </section>

      <section className="bg-surface-secondary py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-gray-900">How to apply</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Wallet,
                step: '1',
                title: 'Choose a product',
                desc: 'Review loan amounts, tenure, and rates above to find what fits your need.',
              },
              {
                icon: Clock,
                step: '2',
                title: 'Submit your application',
                desc: 'Apply through the mobile app or visit a branch with your ID and supporting documents.',
              },
              {
                icon: Shield,
                step: '3',
                title: 'Review & disbursement',
                desc: 'Our team reviews your application. Once approved, funds are disbursed to your account.',
              },
            ].map((item) => (
              <div key={item.step} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                  <item.icon className="h-5 w-5 text-brand-600" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-widest text-brand-600">Step {item.step}</p>
                <h3 className="mt-1 font-display text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Apply via the app
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

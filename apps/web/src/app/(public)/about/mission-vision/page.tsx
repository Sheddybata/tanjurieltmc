import type { Metadata } from 'next';
import { PageHero } from '@/components/public/page-hero';
import { MissionVisionCards } from '@/components/public/mission-vision-cards';
import { SITE, VALUES } from '@/lib/site-content';

export const metadata: Metadata = {
  title: `Mission & Vision | ${SITE.name}`,
  description: `The mission and vision driving ${SITE.name} — accessible finance for every community.`,
};

export default function MissionVisionPage() {
  return (
    <>
      <PageHero
        eyebrow="Mission & Vision"
        title="Why we exist"
        description="Every product we build — from Daily Savings to SME loans — flows from a clear purpose."
        compact
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <MissionVisionCards />

        <div className="mt-16">
          <h2 className="font-display text-2xl font-bold text-gray-900">How we live it every day</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-xl border border-gray-100 p-6">
                <h3 className="font-display text-lg font-bold text-brand-700">{value.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

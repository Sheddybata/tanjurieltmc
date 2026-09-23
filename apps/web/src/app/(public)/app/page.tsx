import type { Metadata } from 'next';
import Link from 'next/link';
import { Smartphone, Shield, Check, AlertCircle } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { AppDownloadButtons, AppDownloadNotice } from '@/components/public/app-download-buttons';
import { PhoneAppPreview } from '@/components/public/phone-app-preview';
import { SITE, APP_FEATURES } from '@/lib/site-content';

export const metadata: Metadata = {
  title: `Download App | ${SITE.name}`,
  description: 'Download the Tanjuriel mobile app for Android. iOS is coming soon — save daily, manage Child Savings accounts, apply for loans, and more.',
};

export default function AppDownloadPage() {
  return (
    <>
      <PageHero
        eyebrow="Mobile banking"
        title="Your bank in your pocket"
        description="Download the Tanjuriel app for Android. The iOS version is coming soon. Daily Savings, Child Savings, loans, transfers, and bills — all in one place."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <PhoneAppPreview className="lg:mx-0" priority />
          </div>

          <div>
            <h2 className="font-display text-2xl font-bold text-gray-900">Download the app</h2>
            <p className="mt-2 text-gray-600">
              Android is ready to install. The iOS build is coming soon.
            </p>

            <div className="mt-8">
              <AppDownloadButtons layout="column" />
            </div>

            <div className="mt-4">
              <AppDownloadNotice />
            </div>

            <h3 className="mt-10 font-display text-lg font-bold text-gray-900">Everything you need</h3>
            <ul className="mt-4 space-y-3">
              {APP_FEATURES.map((feature) => (
                <li key={feature.title} className="flex items-start gap-3">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
                  <div>
                    <p className="font-semibold text-gray-900">{feature.title}</p>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
              <p className="text-sm text-brand-800">
                Already a customer? Open the app and sign in with your mobile PIN. New customers can register and complete KYC in-app.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-surface-secondary py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <div>
              <h2 className="font-display text-xl font-bold text-gray-900">Installation help</h2>
              <div className="mt-4 space-y-4 text-sm leading-relaxed text-gray-600">
                <div>
                  <p className="font-semibold text-gray-900">Android</p>
                  <p className="mt-1">
                    After downloading the .apk file, open it and allow installation from this browser if prompted.
                    You may need to enable &quot;Install unknown apps&quot; for your browser in Settings.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">iPhone (iOS)</p>
                  <p className="mt-1">
                    The iOS app is coming soon. Check back here or visit a branch in the meantime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <Smartphone className="mx-auto h-10 w-10 text-brand-600" />
          <h2 className="mt-4 font-display text-2xl font-bold text-gray-900">Prefer to visit a branch?</h2>
          <p className="mt-3 text-gray-600">
            Our tellers can open Daily Savings or Child Savings accounts for you on the spot.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 hover:text-brand-800"
          >
            Contact us →
          </Link>
        </div>
      </section>
    </>
  );
}

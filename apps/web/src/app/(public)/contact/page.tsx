import type { Metadata } from 'next';
import { Mail, Phone, MapPin, MessageCircle } from 'lucide-react';
import { PageHero } from '@/components/public/page-hero';
import { SITE } from '@/lib/site-content';

export const metadata: Metadata = {
  title: `Contact Us | ${SITE.name}`,
  description: `Get in touch with ${SITE.name} — phone, email, WhatsApp, and branch visits.`,
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We'd love to hear from you"
        description="Visit a branch, call us, or send a message — our team is here to help."
        compact
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Phone, label: 'Phone', value: SITE.phone, href: `tel:${SITE.phone.replace(/\s/g, '')}` },
            { icon: MessageCircle, label: 'WhatsApp', value: SITE.whatsapp, href: `https://wa.me/${SITE.whatsapp.replace(/\D/g, '')}` },
            { icon: Mail, label: 'Email', value: SITE.email, href: `mailto:${SITE.email}` },
            { icon: MapPin, label: 'Location', value: SITE.address, href: undefined },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
                <item.icon className="h-5 w-5 text-brand-600" />
              </div>
              <p className="mt-4 text-sm font-medium text-gray-500">{item.label}</p>
              {item.href ? (
                <a href={item.href} className="mt-1 block font-semibold text-gray-900 hover:text-brand-700">
                  {item.value}
                </a>
              ) : (
                <p className="mt-1 font-semibold text-gray-900">{item.value}</p>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-gray-100 bg-surface-secondary p-8 lg:p-10">
          <h2 className="font-display text-xl font-bold text-gray-900">Opening an account?</h2>
          <p className="mt-3 max-w-2xl text-gray-600">
            Bring a valid ID to any Tanjuriel branch. Our tellers can open Daily Savings, Child Savings, or other account types
            for you. You can also download the mobile app and complete registration from your phone.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-gray-700">
            <li>• Daily Savings — save as often as you like</li>
            <li>• Child Savings — register your child with photo and details, set a maturity date</li>
            <li>• Personal and business loans — ask about eligibility at the branch</li>
          </ul>
        </div>
      </section>
    </>
  );
}

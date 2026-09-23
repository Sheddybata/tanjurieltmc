import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/toast-provider';
import { DOMAINS } from '@/lib/domains';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(DOMAINS.publicSite),
  title: {
    default: 'Tanjuriel Microfinance',
    template: '%s | Tanjuriel Microfinance',
  },
  description:
    'Daily Savings, Child Savings, personal and business loans — accessible financial services for Nigerian communities.',
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-touch-icon.png' }],
  },
  openGraph: {
    images: [{ url: '/og-image.png', width: 1200, height: 1200, alt: 'Tanjuriel' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

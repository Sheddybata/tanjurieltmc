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
    'Daily Savings, My Pikin Savings, personal and business loans — accessible financial services for Nigerian communities.',
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

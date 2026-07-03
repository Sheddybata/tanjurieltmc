import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ToastProvider } from '@/components/ui/toast-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tanjuriel Microfinance Platform',
  description: 'Enterprise admin and teller platform for microfinance institutions',
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

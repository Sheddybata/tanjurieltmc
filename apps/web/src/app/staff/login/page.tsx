'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Landmark, Eye, EyeOff, Lock, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const showDemoAccounts = process.env.NODE_ENV === 'development';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError((err as { message?: string })?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-brand-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div>
          <Link href="/" className="flex items-center gap-3 text-brand-200 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back to website</span>
          </Link>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <Landmark className="h-6 w-6 text-white" />
            </div>
            <span className="font-display text-xl font-bold text-white">Tanjuriel Microfinance</span>
          </div>
        </div>

        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100">
            <Lock className="h-3.5 w-3.5" />
            Authorized personnel only
          </div>
          <h1 className="mt-6 font-display text-4xl font-bold leading-tight text-white">
            Staff portal
          </h1>
          <p className="mt-4 max-w-md text-lg text-brand-200">
            Secure access for tellers, branch managers, and system administrators.
          </p>

          <div className="mt-10 grid grid-cols-2 gap-4">
            {[
              { label: 'Real-time Dashboards', desc: 'Live portfolio & transaction metrics' },
              { label: 'Approval Workflows', desc: 'Manager review for all transactions' },
              { label: 'Loan Workflows', desc: 'Multi-stage approval pipelines' },
              { label: 'Audit Trail', desc: 'Complete action logging' },
            ].map((f) => (
              <div key={f.label} className="rounded-xl bg-white/5 p-4 backdrop-blur">
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="mt-1 text-xs text-brand-200">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-brand-300">&copy; {new Date().getFullYear()} Tanjuriel Microfinance. All rights reserved.</p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between p-4 lg:hidden">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="mb-8 lg:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600">
                  <Landmark className="h-6 w-6 text-white" />
                </div>
                <span className="font-display text-xl font-bold">Tanjuriel</span>
              </div>
            </div>

            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              <Lock className="h-3.5 w-3.5" />
              Staff portal
            </div>
            <h2 className="font-display text-2xl font-bold text-gray-900">Sign in</h2>
            <p className="mt-2 text-sm text-gray-500">Enter your staff credentials to access the platform</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {error && (
                <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
              )}

              <Input
                id="email"
                label="Email address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@tanjuriel.com"
                required
                autoComplete="username"
              />

              <div className="relative">
                <Input
                  id="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <Button type="submit" loading={loading} className="w-full">
                Sign in securely
              </Button>
            </form>

            {showDemoAccounts && (
              <div className="mt-8 rounded-lg border border-gray-100 bg-surface-secondary p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Demo accounts</p>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p><span className="font-medium">Admin:</span> admin@tanjuriel.com</p>
                  <p><span className="font-medium">Manager:</span> manager@tanjuriel.com</p>
                  <p><span className="font-medium">Teller:</span> teller@tanjuriel.com</p>
                  <p className="text-gray-400">Password: Password123!</p>
                </div>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-gray-500">
              Looking for customer banking?{' '}
              <Link href="/app" className="font-medium text-brand-600 hover:text-brand-700">
                Download the app
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string, currency = 'NGN'): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(parseMoneyAmount(amount));
}

/** Parse money from API strings/decimals without float drift. */
export function parseMoneyAmount(value: number | string | null | undefined): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return 0;
    return parseMoneyAmount(value.toFixed(2));
  }
  const cleaned = String(value).replace(/,/g, '').trim();
  if (!cleaned) return 0;
  const negative = cleaned.startsWith('-');
  const abs = negative ? cleaned.slice(1) : cleaned;
  const [wholePart, fracPart = ''] = abs.split('.');
  const cents =
    parseInt(wholePart, 10) * 100 + parseInt(fracPart.padEnd(2, '0').slice(0, 2), 10);
  return (negative ? -1 : 1) * cents / 100;
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-NG').format(n);
}

export function formatPercent(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

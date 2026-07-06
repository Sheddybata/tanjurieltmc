import { BadRequestException } from '@nestjs/common';

/**
 * All money is handled as integer kobo (1 NGN = 100 kobo) before touching the database.
 * JavaScript Number is never used for ledger arithmetic or Prisma Decimal writes.
 */

function invalidAmount(message = 'Invalid amount'): never {
  throw new BadRequestException(message);
}

/** Parse input to integer kobo. Accepts strings (preferred), Prisma Decimal, or numbers. */
export function parseMoneyToKobo(value: unknown): number {
  if (value == null || value === '') invalidAmount();

  if (typeof value === 'bigint') {
    if (value < 0n || value > BigInt(Number.MAX_SAFE_INTEGER)) invalidAmount();
    return Number(value);
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!/^-?\d+(\.\d{0,2})?$/.test(cleaned)) invalidAmount();
    const negative = cleaned.startsWith('-');
    const abs = negative ? cleaned.slice(1) : cleaned;
    const [wholePart, fracPart = ''] = abs.split('.');
    if (fracPart.length > 2) invalidAmount('Amount must have at most 2 decimal places');
    const kobo = parseInt(wholePart, 10) * 100 + parseInt(fracPart.padEnd(2, '0'), 10);
    if (!Number.isSafeInteger(kobo)) invalidAmount();
    return negative ? -kobo : kobo;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalidAmount();
    return parseMoneyToKobo(value.toFixed(2));
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return parseMoneyToKobo(String(value));
  }

  invalidAmount();
}

/** Exact DECIMAL(18,2) string for Prisma — the only format written to money columns. */
export function formatKoboAsDecimal(kobo: number): string {
  if (!Number.isSafeInteger(kobo)) invalidAmount();
  const negative = kobo < 0;
  const abs = Math.abs(kobo);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  return `${negative ? '-' : ''}${whole}.${String(frac).padStart(2, '0')}`;
}

export function toMoneyDecimalString(value: unknown): string {
  return formatKoboAsDecimal(parseMoneyToKobo(value));
}

export function addKobo(a: number, b: number): number {
  const sum = a + b;
  if (!Number.isSafeInteger(sum)) invalidAmount('Amount overflow');
  return sum;
}

export function subtractKobo(a: number, b: number): number {
  return addKobo(a, -b);
}

export function minKobo(a: number, b: number): number {
  return Math.min(a, b);
}

export function maxKobo(a: number, b: number): number {
  return Math.max(a, b);
}

export function compareKobo(a: number, b: number): number {
  return a - b;
}

export function assertPositiveKobo(value: unknown): number {
  const kobo = parseMoneyToKobo(value);
  if (kobo <= 0) invalidAmount('Amount must be greater than zero');
  return kobo;
}

/** Exact major units for notifications (derived from kobo, never float math). */
export function koboToMajorUnits(kobo: number): number {
  return parseMoneyToKobo(formatKoboAsDecimal(kobo)) / 100;
}

/** @deprecated Use parseMoneyToKobo + formatKoboAsDecimal for ledger code. */
export function normalizeMoneyAmount(value: unknown): number {
  return parseMoneyToKobo(value) / 100;
}

export function moneyFromDb(value: unknown): number {
  return koboToMajorUnits(parseMoneyToKobo(value));
}

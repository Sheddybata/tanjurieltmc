/** Parse NGN amounts without IEEE-754 drift (e.g. 10000 staying 10000, not 9999.99). */
export function normalizeMoneyAmount(value: unknown): number {
  if (value == null || value === '') {
    throw new Error('Invalid amount');
  }

  if (typeof value === 'string') {
    const cleaned = value.replace(/,/g, '').trim();
    if (!cleaned || cleaned === '-') {
      throw new Error('Invalid amount');
    }
    const negative = cleaned.startsWith('-');
    const abs = negative ? cleaned.slice(1) : cleaned;
    const [wholePart, fracPart = ''] = abs.split('.');
    if (!/^\d+$/.test(wholePart) || (fracPart && !/^\d+$/.test(fracPart))) {
      throw new Error('Invalid amount');
    }
    const cents =
      parseInt(wholePart, 10) * 100 + parseInt(fracPart.padEnd(2, '0').slice(0, 2), 10);
    return (negative ? -1 : 1) * cents / 100;
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      throw new Error('Invalid amount');
    }
    return normalizeMoneyAmount(value.toFixed(2));
  }

  return normalizeMoneyAmount(String(value));
}

/** Store in Prisma Decimal(18, 2) columns. */
export function toMoneyDecimalString(value: unknown): string {
  return normalizeMoneyAmount(value).toFixed(2);
}

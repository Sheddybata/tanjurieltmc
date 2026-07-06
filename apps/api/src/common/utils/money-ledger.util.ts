import {
  addKobo,
  formatKoboAsDecimal,
  parseMoneyToKobo,
  subtractKobo,
} from './money.util';

/** Prisma-ready balance fields after applying a delta in kobo. */
export function applyBalanceDelta(
  balanceKobo: number,
  heldKobo: number,
  deltaKobo: number,
) {
  const balanceAfterKobo = addKobo(balanceKobo, deltaKobo);
  return {
    balanceBefore: formatKoboAsDecimal(balanceKobo),
    balanceAfter: formatKoboAsDecimal(balanceAfterKobo),
    balance: formatKoboAsDecimal(balanceAfterKobo),
    availableBalance: formatKoboAsDecimal(subtractKobo(balanceAfterKobo, heldKobo)),
    balanceAfterKobo,
  };
}

export function readAccountKobo(account: { balance: unknown; heldBalance: unknown }) {
  return {
    balanceKobo: parseMoneyToKobo(account.balance),
    heldKobo: parseMoneyToKobo(account.heldBalance),
  };
}

export function applyHoldDelta(balanceKobo: number, heldKobo: number, holdDeltaKobo: number) {
  const heldAfterKobo = addKobo(heldKobo, holdDeltaKobo);
  return {
    heldBalance: formatKoboAsDecimal(heldAfterKobo),
    availableBalance: formatKoboAsDecimal(subtractKobo(balanceKobo, heldAfterKobo)),
    heldAfterKobo,
  };
}

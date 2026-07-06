import { Transform } from 'class-transformer';
import { normalizeMoneyAmount } from '../utils/money.util';

export function TransformMoney() {
  return Transform(({ value }) => {
    if (value == null || value === '') return value;
    return normalizeMoneyAmount(value);
  });
}

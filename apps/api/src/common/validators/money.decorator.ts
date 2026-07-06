import { Transform } from 'class-transformer';
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';
import { parseMoneyToKobo, koboToMajorUnits } from '../utils/money.util';

/** Normalize API money input to exact major units (from kobo, never float). */
export function TransformMoney() {
  return Transform(({ value }) => {
    if (value == null || value === '') return value;
    const kobo = parseMoneyToKobo(value);
    return koboToMajorUnits(kobo);
  });
}

/** Reject amounts with invalid format or more than 2 decimal places. */
export function IsMoneyAmount(options?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isMoneyAmount',
      target: object.constructor,
      propertyName,
      options,
      validator: {
        validate(value: unknown) {
          if (value == null || value === '') return false;
          try {
            parseMoneyToKobo(value);
            return true;
          } catch {
            return false;
          }
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a valid amount with at most 2 decimal places`;
        },
      },
    });
  };
}

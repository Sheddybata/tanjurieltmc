import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

/** Prisma @default(cuid()) ids — not RFC UUIDs. */
export function IsEntityId() {
  return applyDecorators(
    IsString(),
    IsNotEmpty(),
    Matches(/^c[a-z0-9]{20,}$/i, { message: '$property must be a valid id' }),
  );
}

import { ForbiddenException } from '@nestjs/common';
import { CustomerKycStatus } from '@tanjuriel/database';
import { PrismaService } from '../prisma/prisma.service';

export async function ensureCustomerKycVerified(
  prisma: PrismaService,
  customerId: string,
): Promise<void> {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: { kycStatus: true },
  });

  if (!customer || customer.kycStatus !== CustomerKycStatus.VERIFIED) {
    throw new ForbiddenException(
      'Your account is pending verification. Visit our Jos branch or wait for teller approval.',
    );
  }
}

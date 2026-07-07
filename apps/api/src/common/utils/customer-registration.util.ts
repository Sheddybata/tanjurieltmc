import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import {
  AccountStatus,
  AccountType,
  CustomerKycStatus,
  RegistrationSource,
} from '@tanjuriel/database';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  customerProfileCreateData,
  normalizePhone,
} from '../../common/utils/customer-profile.util';
import {
  generateAccountNumber,
  generateCustomerNumber,
  generatePaymentRef,
} from '../../common/utils/reference.util';
import { CustomerAuthService } from '../../modules/customer-auth/customer-auth.service';
import { CustomerRegisterDto } from '../../modules/customer-auth/dto/customer-auth.dto';

export async function registerMobileCustomer(
  prisma: PrismaService,
  authService: CustomerAuthService,
  dto: CustomerRegisterDto,
  photoUrl?: string,
) {
  if (!photoUrl) {
    throw new BadRequestException('Customer photo is required');
  }

  const phone = normalizePhone(dto.phone);
  const alternatePhone = dto.alternatePhone ? normalizePhone(dto.alternatePhone) : undefined;
  const profileDto = { ...dto, phone, alternatePhone };

  const existing = await prisma.customer.findFirst({
    where: {
      OR: [{ phone }, { bvn: dto.bvn }, { nin: dto.nin }],
    },
  });
  if (existing) {
    throw new ConflictException('Phone, BVN, or NIN is already registered');
  }

  const branch = await prisma.branch.findUnique({ where: { code: 'JOS001' } });
  if (!branch) throw new NotFoundException('Default branch not configured');

  const teller = await prisma.user.findUnique({ where: { email: 'teller@tanjuriel.com' } });
  if (!teller) throw new NotFoundException('Default teller not configured');

  const customerNumber = generateCustomerNumber();
  const accountNumber = generateAccountNumber();
  const pinHash = await bcrypt.hash(dto.pin, 12);

  await prisma.$transaction(async (tx) => {
    const created = await tx.customer.create({
      data: {
        customerNumber,
        paymentRef: generatePaymentRef(accountNumber),
        ...customerProfileCreateData(profileDto, photoUrl),
        phone,
        pinHash,
        kycStatus: CustomerKycStatus.PENDING,
        appEnabled: true,
        branchId: branch.id,
        registeredById: teller.id,
        registrationSource: RegistrationSource.MOBILE,
      },
    });

    await tx.account.create({
      data: {
        accountNumber,
        type: AccountType.SAVINGS,
        status: AccountStatus.ACTIVE,
        customerId: created.id,
        branchId: branch.id,
        openedById: teller.id,
        openedAt: new Date(),
      },
    });
  });

  return authService.login({ phone, pin: dto.pin });
}

export function validateCollateralInput(
  requiresCollateral: boolean,
  dto: {
    collateral?: string;
    collateralType?: string;
    collateralEstimatedValue?: number;
    guarantorName?: string;
    guarantorPhone?: string;
  },
) {
  if (!requiresCollateral) return;

  if (!dto.collateral?.trim()) {
    throw new BadRequestException('Collateral description is required');
  }
  if (!dto.collateralType) {
    throw new BadRequestException('Collateral type is required');
  }
  if (dto.collateralEstimatedValue == null || dto.collateralEstimatedValue <= 0) {
    throw new BadRequestException('Estimated collateral value is required');
  }
  if (!dto.guarantorName?.trim() || !dto.guarantorPhone?.trim()) {
    throw new BadRequestException('Guarantor name and phone are required');
  }
}

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuthTokens, CustomerJwtPayload } from '@tanjuriel/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CustomerLoginDto, CustomerChangePinDto, CustomerRegisterDto } from './dto/customer-auth.dto';
import { registerMobileCustomer } from '../../common/utils/customer-registration.util';

@Injectable()
export class CustomerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: CustomerRegisterDto) {
    return registerMobileCustomer(this.prisma, this, dto);
  }

  async login(dto: CustomerLoginDto): Promise<AuthTokens & { customer: object }> {
    const phone = this.normalizePhone(dto.phone);

    const customer = await this.prisma.customer.findFirst({
      where: { phone },
      include: {
        accounts: {
          where: { status: { in: ['ACTIVE', 'PENDING'] } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!customer || !customer.appEnabled || !customer.pinHash) {
      throw new UnauthorizedException('Invalid phone or PIN');
    }

    const valid = await bcrypt.compare(dto.pin, customer.pinHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid phone or PIN');
    }

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: { lastAppLoginAt: new Date() },
    });

    const tokens = await this.generateTokens({
      sub: customer.id,
      authType: 'customer',
      phone: customer.phone,
      customerId: customer.id,
    });

    const { pinHash, ...safeCustomer } = customer;
    return { ...tokens, customer: safeCustomer };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.customerRefreshToken.findUnique({
      where: { token: refreshToken },
      include: { customer: true },
    });

    if (!stored || stored.expiresAt < new Date() || !stored.customer.appEnabled) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.customerRefreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens({
      sub: stored.customer.id,
      authType: 'customer',
      phone: stored.customer.phone,
      customerId: stored.customer.id,
    });
  }

  async logout(customerId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.customerRefreshToken.deleteMany({ where: { token: refreshToken } });
    } else {
      await this.prisma.customerRefreshToken.deleteMany({ where: { customerId } });
    }
  }

  async changePin(customerId: string, dto: CustomerChangePinDto): Promise<void> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer?.pinHash) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPin, customer.pinHash);
    if (!valid) throw new BadRequestException('Current PIN is incorrect');

    const pinHash = await bcrypt.hash(dto.newPin, 12);
    await this.prisma.customer.update({ where: { id: customerId }, data: { pinHash } });
    await this.prisma.customerRefreshToken.deleteMany({ where: { customerId } });
  }

  async verifyPin(customerId: string, pin: string): Promise<boolean> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer?.pinHash) return false;
    return bcrypt.compare(pin, customer.pinHash);
  }

  private async generateTokens(payload: CustomerJwtPayload): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpires) || 7);

    await this.prisma.customerRefreshToken.create({
      data: { token: refreshToken, customerId: payload.customerId, expiresAt },
    });

    return { accessToken, refreshToken, expiresIn: 28800 };
  }

  private normalizePhone(phone: string): string {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('234')) return `0${digits.slice(3)}`;
    if (digits.startsWith('0')) return digits;
    return `0${digits}`;
  }
}

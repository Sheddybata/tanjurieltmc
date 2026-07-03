import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { AuditAction } from '@tanjuriel/database';
import { JwtPayload, AuthTokens, UserRole } from '@tanjuriel/shared';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { LoginDto, ChangePasswordDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private auditService: AuditService,
  ) {}

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthTokens & { user: object }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: { branch: true },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens({
      sub: user.id,
      authType: 'staff',
      email: user.email,
      role: user.role as UserRole,
      branchId: user.branchId ?? undefined,
      employeeId: user.employeeId,
    });

    await this.auditService.log({
      action: AuditAction.LOGIN,
      entityType: 'auth',
      entityId: user.id,
      userId: user.id,
      ipAddress,
      userAgent,
    });

    const { passwordHash, ...safeUser } = user;
    return { ...tokens, user: safeUser };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!stored || stored.expiresAt < new Date() || stored.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });

    return this.generateTokens({
      sub: stored.user.id,
      authType: 'staff',
      email: stored.user.email,
      role: stored.user.role as UserRole,
      branchId: stored.user.branchId ?? undefined,
      employeeId: stored.user.employeeId,
    });
  }

  async logout(userId: string, refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
    } else {
      await this.prisma.refreshToken.deleteMany({ where: { userId } });
    }

    await this.auditService.log({
      action: AuditAction.LOGOUT,
      entityType: 'auth',
      entityId: userId,
      userId,
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();

    const valid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Current password is incorrect');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.prisma.refreshToken.deleteMany({ where: { userId } });
  }

  private async generateTokens(payload: JwtPayload): Promise<AuthTokens> {
    const accessToken = this.jwtService.sign(payload);
    const refreshToken = uuidv4();
    const refreshExpires = this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d';
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpires) || 7);

    await this.prisma.refreshToken.create({
      data: { token: refreshToken, userId: payload.sub, expiresAt },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 28800,
    };
  }
}

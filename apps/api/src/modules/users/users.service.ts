import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRole } from '@tanjuriel/database';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { paginate, paginationMeta } from '../../common/utils/reference.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const allowedRoles: UserRole[] = [UserRole.TELLER, UserRole.MANAGER, UserRole.ACCOUNT_OFFICER];
    if (!allowedRoles.includes(dto.role)) {
      throw new BadRequestException('Only teller, manager, and account officer accounts can be created here');
    }

    if (dto.role === UserRole.ACCOUNT_OFFICER) {
      if (!dto.accountOfficer) {
        throw new BadRequestException('Select which account officer this login represents');
      }
      const taken = await this.prisma.user.findFirst({
        where: { accountOfficer: dto.accountOfficer },
      });
      if (taken) {
        throw new ConflictException('An login already exists for this account officer');
      }
    } else {
      if (!dto.branchId) {
        throw new BadRequestException('Branch is required for teller and manager accounts');
      }
      const branch = await this.prisma.branch.findFirst({
        where: { id: dto.branchId, isActive: true },
      });
      if (!branch) throw new BadRequestException('Invalid or inactive branch');
    }

    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { employeeId: dto.employeeId }] },
    });
    if (existing) throw new ConflictException('Email or employee ID already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const { password: _password, ...userData } = dto;
    const user = await this.prisma.user.create({
      data: {
        employeeId: userData.employeeId,
        email: dto.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        role: userData.role,
        branchId: userData.role === UserRole.ACCOUNT_OFFICER ? null : userData.branchId,
        accountOfficer: userData.role === UserRole.ACCOUNT_OFFICER ? userData.accountOfficer : null,
        passwordHash,
      },
      include: { branch: true },
    });

    const { passwordHash: _, ...safe } = user;
    return safe;
  }

  async findAll(page = 1, limit = 20, role?: string) {
    const { skip, take, page: p, limit: l } = paginate(page, limit);
    const where = role ? { role: role as never } : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        include: { branch: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map(({ passwordHash, ...u }) => u),
      meta: paginationMeta(total, p, l),
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { branch: true },
    });
    if (!user) throw new NotFoundException('User not found');
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async update(id: string, dto: UpdateUserDto) {
    const current = await this.findOne(id);
    if (dto.accountOfficer && dto.accountOfficer !== current.accountOfficer) {
      const taken = await this.prisma.user.findFirst({
        where: { accountOfficer: dto.accountOfficer, id: { not: id } },
      });
      if (taken) throw new ConflictException('Another user is already linked to this account officer');
    }
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { branch: true },
    });
    const { passwordHash, ...safe } = user;
    return safe;
  }

  async resetPassword(id: string, password: string) {
    await this.findOne(id);
    const passwordHash = await bcrypt.hash(password, 12);
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
    return { message: 'Password updated' };
  }
}

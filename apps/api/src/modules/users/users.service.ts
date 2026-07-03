import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateUserDto, UpdateUserDto } from './dto/users.dto';
import { paginate, paginationMeta } from '../../common/utils/reference.util';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email.toLowerCase() }, { employeeId: dto.employeeId }] },
    });
    if (existing) throw new ConflictException('Email or employee ID already exists');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        ...dto,
        email: dto.email.toLowerCase(),
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
    await this.findOne(id);
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      include: { branch: true },
    });
    const { passwordHash, ...safe } = user;
    return safe;
  }
}

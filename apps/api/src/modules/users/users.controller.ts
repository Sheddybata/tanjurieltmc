import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Permission } from '@tanjuriel/shared';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, ResetUserPasswordDto } from './dto/users.dto';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards/auth.guards';
import { Permissions } from '../../common/decorators/auth.decorators';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Create a new system user' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return { success: true, data: user };
  }

  @Get()
  @Permissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: 'List all users' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
  ) {
    const result = await this.usersService.findAll(Number(page) || 1, Number(limit) || 20, role);
    return { success: true, ...result };
  }

  @Get(':id')
  @Permissions(Permission.VIEW_USERS)
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    const user = await this.usersService.findOne(id);
    return { success: true, data: user };
  }

  @Patch(':id/password')
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Reset user password (admin)' })
  async resetPassword(@Param('id') id: string, @Body() dto: ResetUserPasswordDto) {
    const result = await this.usersService.resetPassword(id, dto.password);
    return { success: true, ...result };
  }

  @Patch(':id')
  @Permissions(Permission.MANAGE_USERS)
  @ApiOperation({ summary: 'Update user' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.update(id, dto);
    return { success: true, data: user };
  }
}

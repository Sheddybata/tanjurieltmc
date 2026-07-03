import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto, ChangePasswordDto } from './dto/auth.dto';
import { Public, User, AuditSkip } from '../../common/decorators/auth.decorators';
import { JwtAuthGuard } from '../../common/guards/auth.guards';
import { JwtPayload } from '@tanjuriel/shared';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuditSkip()
  @ApiOperation({ summary: 'Authenticate user and receive JWT tokens' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(
      dto,
      req.ip,
      req.headers['user-agent'],
    );
    return { success: true, data: result };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @AuditSkip()
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body() dto: RefreshTokenDto) {
    const tokens = await this.authService.refresh(dto.refreshToken);
    return { success: true, data: tokens };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @AuditSkip()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  async logout(@User() user: JwtPayload, @Body() dto: RefreshTokenDto) {
    await this.authService.logout(user.sub, dto.refreshToken);
    return { success: true, message: 'Logged out successfully' };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(@User('sub') userId: string, @Body() dto: ChangePasswordDto) {
    await this.authService.changePassword(userId, dto);
    return { success: true, message: 'Password updated successfully' };
  }
}

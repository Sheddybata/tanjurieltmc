import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/auth.decorators';
import { User } from '../../common/decorators/auth.decorators';
import { CustomerGuard, JwtAuthGuard } from '../../common/guards/auth.guards';
import { CustomerJwtPayload } from '@tanjuriel/shared';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerChangePinDto, CustomerLoginDto, CustomerRegisterDto } from './dto/customer-auth.dto';

@ApiTags('Customer Auth')
@Controller('customer/auth')
export class CustomerAuthController {
  constructor(private customerAuthService: CustomerAuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Self-register via mobile app (KYC pending until teller verifies)' })
  async register(@Body() dto: CustomerRegisterDto) {
    const result = await this.customerAuthService.register(dto);
    return { success: true, data: result };
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Customer login with phone and PIN' })
  async login(@Body() dto: CustomerLoginDto) {
    const result = await this.customerAuthService.login(dto);
    return { success: true, data: result };
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh customer access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    const tokens = await this.customerAuthService.refresh(refreshToken);
    return { success: true, data: tokens };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Customer logout' })
  async logout(
    @User() user: CustomerJwtPayload,
    @Body('refreshToken') refreshToken?: string,
  ) {
    await this.customerAuthService.logout(user.customerId, refreshToken);
    return { success: true, message: 'Logged out' };
  }

  @Post('change-pin')
  @UseGuards(JwtAuthGuard, CustomerGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change customer transaction PIN' })
  async changePin(@User() user: CustomerJwtPayload, @Body() dto: CustomerChangePinDto) {
    await this.customerAuthService.changePin(user.customerId, dto);
    return { success: true, message: 'PIN updated' };
  }
}

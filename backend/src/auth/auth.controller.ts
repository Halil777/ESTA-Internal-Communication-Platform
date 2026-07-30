import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import {
  ActivateDeviceDto,
  LoginDto,
  RefreshTokenDto,
  UpdatePushTokenDto,
} from './dto/auth.dto';
import { User } from '../users/entities/user.entity';

interface AuthenticatedRequest extends Request {
  user: {
    deviceId: string;
  };
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with username & password' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  getMe(@CurrentUser() user: User) {
    return user;
  }

  @Post('activate-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate device using QR code activation code' })
  activateDevice(@Body() dto: ActivateDeviceDto, @Req() req: Request) {
    const ip = (req.headers['x-forwarded-for'] as string) ?? req.ip;
    return this.authService.activateDevice(dto, ip);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout (client clears tokens)' })
  logout() {
    return;
  }

  @Get('sip-provisioning')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get SIP credentials for the authenticated device' })
  getSipProvisioning(@CurrentUser() user: User) {
    return this.authService.getSipProvisioning(user.id);
  }

  @Post('devices/push-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Update FCM push token for this device' })
  updatePushToken(
    @CurrentUser() user: User,
    @Body() dto: UpdatePushTokenDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.updatePushToken(
      user.id,
      req.user.deviceId,
      dto.pushToken,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'List all registered devices' })
  findAll() {
    return this.devicesService.findAll();
  }

  @Get('user/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Get devices for a specific user' })
  findByUser(@Param('userId') userId: string) {
    return this.devicesService.findByUser(userId);
  }

  @Post(':id/revoke')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke a device (force logout)' })
  revoke(@Param('id') id: string) {
    return this.devicesService.revoke(id);
  }

  @Post('user/:userId/revoke-all')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke all devices for a user' })
  revokeAll(@Param('userId') userId: string) {
    return this.devicesService.revokeAllForUser(userId);
  }
}

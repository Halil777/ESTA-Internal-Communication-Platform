import {
  Controller,
  Get,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CallsService } from './calls.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole, User } from '../users/entities/user.entity';

@ApiTags('Calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Get('history')
  @ApiOperation({ summary: 'Get call history for current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getHistory(
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.callsService.getHistory(user.id, limit);
  }

  @Get('missed')
  @ApiOperation({ summary: 'Get missed calls for current user' })
  getMissed(@CurrentUser() user: User) {
    return this.callsService.getMissed(user.id);
  }

  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Get all call records (admin)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'direction', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  getAdminHistory(
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit: number,
    @Query('direction') direction?: string,
    @Query('status') status?: string,
    @Query('extension') extension?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.callsService.getAdminHistory({
      limit,
      direction,
      status,
      extension,
      from,
      to,
    });
  }

  @Get('live')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Get live Asterisk channels (admin)' })
  getLiveCalls() {
    return this.callsService.getLiveCalls();
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Get overall call statistics (admin)' })
  getStats() {
    return this.callsService.getStats();
  }
}

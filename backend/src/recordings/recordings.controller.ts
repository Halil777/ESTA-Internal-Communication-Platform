import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { RecordingsService } from './recordings.service';

@ApiTags('Recordings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
@Controller('recordings')
export class RecordingsController {
  constructor(private readonly recordingsService: RecordingsService) {}

  @Get()
  @ApiOperation({ summary: 'List call recording metadata' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'extension', required: false, type: String })
  @ApiQuery({ name: 'from', required: false, type: String })
  @ApiQuery({ name: 'to', required: false, type: String })
  findAll(
    @Query('limit', new DefaultValuePipe(200), ParseIntPipe) limit: number,
    @Query('extension') extension?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.recordingsService.findAll({ limit, extension, from, to });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Recording storage statistics' })
  stats() {
    return this.recordingsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one recording metadata record' })
  findOne(@Param('id') id: string) {
    return this.recordingsService.findOne(id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ExtensionsService } from './extensions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import {
  AssignExtensionDto,
  ForwardExtensionDto,
  ReserveExtensionDto,
  UpdateExtensionPolicyDto,
} from './dto/extension.dto';

@ApiTags('Extensions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('extensions')
export class ExtensionsController {
  constructor(private readonly extensionsService: ExtensionsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'List all extensions' })
  findAll() {
    return this.extensionsService.findAll();
  }

  @Get(':number')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Get one extension' })
  findOne(@Param('number') number: string) {
    return this.extensionsService.findOne(number);
  }

  @Get('check/:number')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Check if extension number is available' })
  async checkAvailability(@Param('number') number: string) {
    const available = await this.extensionsService.isAvailable(number);
    return {
      extensionNumber: number,
      available,
      message: available
        ? `Extension ${number} is available`
        : `Extension ${number} is already assigned or reserved`,
    };
  }

  @Post('assign')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Assign extension to a user' })
  assign(@Body() dto: AssignExtensionDto) {
    return this.extensionsService.assign(dto);
  }

  @Post('reserve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Reserve an extension number' })
  reserve(@Body() dto: ReserveExtensionDto) {
    return this.extensionsService.reserve(dto);
  }

  @Post(':number/release')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Release extension (unassign from user)' })
  release(@Param('number') number: string) {
    return this.extensionsService.release(number);
  }

  @Post(':number/disable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Disable an extension' })
  disable(@Param('number') number: string) {
    return this.extensionsService.disable(number);
  }

  @Post(':number/enable')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enable a disabled extension' })
  enable(@Param('number') number: string) {
    return this.extensionsService.enable(number);
  }

  @Patch(':number/forward')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Set call forwarding for extension' })
  setForwarding(
    @Param('number') number: string,
    @Body() dto: ForwardExtensionDto,
  ) {
    return this.extensionsService.setCallForwarding(number, dto);
  }

  @Patch(':number')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Update extension PBX policy' })
  updatePolicy(
    @Param('number') number: string,
    @Body() dto: UpdateExtensionPolicyDto,
  ) {
    return this.extensionsService.updatePolicy(number, dto);
  }

  @Post(':number/reset-secret')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Reset SIP secret for an assigned extension' })
  resetSecret(@Param('number') number: string) {
    return this.extensionsService.resetSecret(number);
  }

  @Get(':number/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @ApiOperation({ summary: 'Get SIP registration status for an extension' })
  status(@Param('number') number: string) {
    return this.extensionsService.getStatus(number);
  }

  @Delete(':number')
  @Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an extension record' })
  remove(@Param('number') number: string) {
    return this.extensionsService.remove(number);
  }
}

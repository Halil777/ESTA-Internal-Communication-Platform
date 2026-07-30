import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AssignExtensionDto {
  @ApiProperty({ example: '777', description: '3-5 digit extension number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3,5}$/, { message: 'Extension must be 3-5 digits' })
  extensionNumber: string;

  @ApiProperty({ example: 'uuid-user-id' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  allowIncomingCalls?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  allowOutgoingCalls?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  allowBroadcast?: boolean;

  @ApiPropertyOptional({ example: 'Halil Gayypov' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  recordCalls?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  allowInternal?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  allowExternal?: boolean;

  @ApiPropertyOptional({ example: 'opus,g722,ulaw,alaw' })
  @IsString()
  @IsOptional()
  allowedCodecs?: string;
}

export class ReserveExtensionDto {
  @ApiProperty({ example: '911' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3,5}$/, { message: 'Extension must be 3-5 digits' })
  extensionNumber: string;

  @ApiPropertyOptional({ example: 'Emergency line' })
  @IsString()
  @IsOptional()
  reservedFor?: string;
}

export class ForwardExtensionDto {
  @ApiPropertyOptional({
    example: '101',
    description: 'null to clear forwarding',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{3,5}$/, { message: 'Must be 3-5 digits' })
  forwardTo?: string;
}

export class UpdateExtensionPolicyDto {
  @ApiPropertyOptional({ example: 'Halil Gayypov' })
  @IsString()
  @IsOptional()
  displayName?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowIncomingCalls?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowOutgoingCalls?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowInternal?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  allowExternal?: boolean;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  recordCalls?: boolean;

  @ApiPropertyOptional({ example: 'opus,g722,ulaw,alaw' })
  @IsString()
  @IsOptional()
  allowedCodecs?: string;
}

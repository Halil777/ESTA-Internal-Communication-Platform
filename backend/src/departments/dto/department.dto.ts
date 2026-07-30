import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Information Technology' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'IT' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ example: 2 })
  @IsInt()
  @Min(1)
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({
    example: '200',
    description: 'Group extension for the department',
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{3,5}$/)
  groupExtension?: string;
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}

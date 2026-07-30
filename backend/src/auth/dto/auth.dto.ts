import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'halil.gayypov' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class ActivateDeviceDto {
  @ApiProperty({ example: 'ESTA-XXXX-XXXX' })
  @IsString()
  @IsNotEmpty()
  activationCode: string;

  @ApiProperty({ example: 'uuid-device-id' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty({ example: 'Samsung' })
  @IsString()
  @IsNotEmpty()
  brand: string;

  @ApiProperty({ example: 'Galaxy S24' })
  @IsString()
  @IsNotEmpty()
  model: string;

  @ApiProperty({ example: '14' })
  @IsString()
  @IsNotEmpty()
  androidVersion: string;

  @ApiProperty({ example: '1.0.0' })
  @IsString()
  @IsNotEmpty()
  appVersion: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  pushToken?: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class UpdatePushTokenDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  pushToken: string;
}

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtSignOptions } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User } from '../users/entities/user.entity';
import { Device, DeviceStatus } from '../devices/entities/device.entity';
import { ActivateDeviceDto, LoginDto } from './dto/auth.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { SipService } from '../sip/sip.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectRepository(Device)
    private devicesRepo: Repository<Device>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private sipService: SipService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.usersRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.extension', 'extension')
      .leftJoinAndSelect('user.department', 'department')
      .where('user.username = :username', { username: dto.username })
      .andWhere('user.isActive = true')
      .getOne();

    if (!user) throw new UnauthorizedException('Invalid credentials');

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid credentials');

    return this.generateTokens(user);
  }

  async activateDevice(dto: ActivateDeviceDto, ip: string) {
    // Activation code format: ESTA-{userId}-{random}
    const parts = dto.activationCode.split('-');
    if (parts.length < 3 || parts[0] !== 'ESTA') {
      throw new BadRequestException('Invalid activation code format');
    }
    const userId = parts[1];

    const user = await this.usersRepo.findOne({
      where: { id: userId, isActive: true },
      relations: ['extension', 'department'],
    });
    if (!user) throw new NotFoundException('User not found');

    // Check if device already registered
    const existingDevice = await this.devicesRepo.findOne({
      where: { deviceUuid: dto.deviceId, userId: user.id },
    });

    if (existingDevice && existingDevice.status === DeviceStatus.REVOKED) {
      throw new UnauthorizedException('This device has been revoked');
    }

    // Register or update device
    const device =
      existingDevice ?? this.devicesRepo.create({ userId: user.id });
    device.deviceUuid = dto.deviceId;
    device.brand = dto.brand;
    device.model = dto.model;
    device.deviceName = `${dto.brand} ${dto.model}`.trim();
    device.deviceType = 'ANDROID_PHONE';
    device.platform = 'ANDROID';
    device.androidVersion = dto.androidVersion;
    device.appVersion = dto.appVersion;
    device.pushToken = dto.pushToken ?? null;
    device.lastIp = ip;
    device.lastIpAddress = ip;
    device.lastSeenAt = new Date();
    device.extensionId = user.extension?.id ?? null;
    device.status = DeviceStatus.ACTIVE;
    device.revokedAt = null;
    await this.devicesRepo.save(device);

    return this.generateTokens(user, dto.deviceId);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersRepo.findOne({
        where: { id: payload.sub, isActive: true },
        relations: ['extension', 'department'],
      });
      if (!user) throw new UnauthorizedException();
      return this.generateTokens(user, payload.deviceId);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getSipProvisioning(userId: string) {
    return this.sipService.getProvisioningForUser(userId);
  }

  async updatePushToken(userId: string, deviceId: string, pushToken: string) {
    await this.devicesRepo.update(
      { userId, deviceUuid: deviceId },
      { pushToken, lastSeenAt: new Date() },
    );
  }

  private async generateTokens(user: User, deviceId?: string) {
    const payload: JwtPayload = {
      sub: user.id,
      username: user.username,
      role: user.role,
      deviceId: deviceId ?? 'web',
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
      } as JwtSignOptions),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
      } as JwtSignOptions),
    ]);

    return {
      accessToken,
      refreshToken,
      userId: user.id,
      extension: user.extension?.extensionNumber ?? '',
      deviceId: deviceId ?? 'web',
    };
  }
}

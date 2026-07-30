import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device, DeviceStatus } from './entities/device.entity';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private devicesRepo: Repository<Device>,
    private wsGateway: WebsocketGateway,
  ) {}

  async findAll() {
    return this.devicesRepo.find({
      relations: ['user', 'user.department', 'extension'],
      order: { lastSeenAt: 'DESC' },
    });
  }

  async findByUser(userId: string) {
    return this.devicesRepo.find({
      where: { userId },
      relations: ['extension'],
      order: { lastSeenAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const device = await this.devicesRepo.findOne({
      where: { id },
      relations: ['user', 'extension'],
    });
    if (!device) throw new NotFoundException(`Device ${id} not found`);
    return device;
  }

  async revoke(id: string) {
    const device = await this.findOne(id);
    device.status = DeviceStatus.REVOKED;
    device.registered = false;
    device.sipRegistered = false;
    device.revokedAt = new Date();
    await this.devicesRepo.save(device);
    // Notify device to log out
    this.wsGateway.emitDeviceRevoked(device.userId, id);
  }

  async revokeAllForUser(userId: string) {
    await this.devicesRepo.update(
      { userId },
      {
        status: DeviceStatus.REVOKED,
        registered: false,
        sipRegistered: false,
        revokedAt: new Date(),
      },
    );
    this.wsGateway.emitDeviceRevoked(userId, 'all');
  }

  async updateLastSeen(deviceUuid: string, ip?: string) {
    await this.devicesRepo.update(
      { deviceUuid },
      { lastSeenAt: new Date(), lastIp: ip, lastIpAddress: ip },
    );
  }

  async markSipRegistered(deviceUuid: string, registered: boolean) {
    await this.devicesRepo.update(
      { deviceUuid },
      {
        sipRegistered: registered,
        registered,
        lastRegistrationAt: registered ? new Date() : null,
      },
    );
  }
}

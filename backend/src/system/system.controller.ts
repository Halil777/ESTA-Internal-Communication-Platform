import { Controller, Get, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as os from 'os';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, User } from '../users/entities/user.entity';
import { Device } from '../devices/entities/device.entity';
import { Extension } from '../extensions/entities/extension.entity';
import { AsteriskService } from '../sip/asterisk.service';
import { WebsocketGateway } from '../websocket/websocket.gateway';
import { CallsService } from '../calls/calls.service';
import { RecordingsService } from '../recordings/recordings.service';

@ApiTags('System')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.OFFICE_ADMIN)
@Controller('system')
export class SystemController {
  constructor(
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Device) private devicesRepo: Repository<Device>,
    @InjectRepository(Extension) private extensionsRepo: Repository<Extension>,
    private dataSource: DataSource,
    private config: ConfigService,
    private asteriskService: AsteriskService,
    private wsGateway: WebsocketGateway,
    private callsService: CallsService,
    private recordingsService: RecordingsService,
  ) {}

  @Get('health')
  @ApiOperation({ summary: 'System health check' })
  async health() {
    const database = await this.checkDatabase();
    const redis = await this.checkRedis();
    return {
      status: database && redis && this.asteriskService.isConnected() ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database,
      redis,
      asterisk: this.asteriskService.isConnected(),
      ami: this.asteriskService.isConnected() ? 'connected' : 'disconnected',
    };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Admin dashboard stats' })
  async dashboard() {
    const [
      totalUsers,
      activeUsers,
      totalDevices,
      sipDevices,
      callStats,
      recordingStats,
      allExtensions,
      liveCalls,
    ] = await Promise.all([
      this.usersRepo.count(),
      this.usersRepo.count({ where: { isActive: true } }),
      this.devicesRepo.count(),
      this.devicesRepo.count({ where: { sipRegistered: true } }),
      this.callsService.getStats(),
      this.recordingsService.getStats(),
      this.extensionsRepo.find(),
      this.asteriskService.getLiveChannels(),
    ]);

    const onlineUserIds = this.wsGateway.getOnlineUserIds();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const memUsedPct = ((totalMem - freeMem) / totalMem) * 100;

    // CPU usage approximation
    const cpus = os.cpus();
    const cpuUsage =
      cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
      }, 0) / cpus.length;

    const extensionsInUse = allExtensions.filter((e) => !!e.userId).length;
    const extensionsAvailable = allExtensions.filter(
      (e) => !e.userId && !e.isReserved && e.status !== 'DISABLED',
    ).length;

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        online: onlineUserIds.length,
        offline: activeUsers - onlineUserIds.length,
      },
      extensions: {
        total: allExtensions.length,
        inUse: extensionsInUse,
        available: extensionsAvailable,
      },
      devices: {
        total: totalDevices,
        sipRegistered: sipDevices,
        registered: totalDevices,
      },
      calls: {
        today: callStats.today,
        total: callStats.total,
        missed: callStats.missed,
        missedToday: callStats.missedToday,
        completed: callStats.completed,
        averageDurationSeconds: callStats.averageDurationSeconds,
        totalDuration: 0,
      },
      pbx: {
        connected: this.asteriskService.isConnected(),
        status: this.asteriskService.isConnected() ? 'healthy' : 'disconnected',
        activeCalls: liveCalls.length,
        amiHost: this.config.get<string>('ASTERISK_HOST', '127.0.0.1'),
        amiPort: this.config.get<number>('ASTERISK_AMI_PORT', 5038),
        sipDomain: this.config.get<string>('ASTERISK_SIP_DOMAIN', '10.10.20.1'),
        sipPort: this.config.get<number>('ASTERISK_SIP_PORT', 5060),
        sipTransport: this.config.get<string>('ASTERISK_SIP_TRANSPORT', 'UDP'),
      },
      recordings: {
        total: recordingStats.total,
        sizeBytes: recordingStats.sizeBytes,
        storagePath: this.config.get<string>(
          'RECORDINGS_PATH',
          '/var/lib/esta-pbx/recordings',
        ),
      },
      server: {
        platform: os.platform(),
        cpuCores: cpus.length,
        cpuUsage: Math.round(cpuUsage * 10) / 10,
        memoryTotal: Math.round(totalMem / 1024 / 1024),
        memoryFree: Math.round(freeMem / 1024 / 1024),
        memoryUsedPct: Math.round(memUsedPct * 10) / 10,
        memUsage: Math.round(memUsedPct * 10) / 10,
        uptime: Math.round(os.uptime()),
        nodeVersion: process.version,
      },
    };
  }

  @Get('pbx-status')
  @ApiOperation({ summary: 'Asterisk PBX status' })
  pbxStatus() {
    return {
      connected: this.asteriskService.isConnected(),
      status: this.asteriskService.isConnected() ? 'healthy' : 'disconnected',
      amiHost: this.config.get<string>('ASTERISK_HOST', '127.0.0.1'),
      amiPort: this.config.get<number>('ASTERISK_AMI_PORT', 5038),
      sipDomain: this.config.get<string>('ASTERISK_SIP_DOMAIN', '10.10.20.1'),
      sipPort: this.config.get<number>('ASTERISK_SIP_PORT', 5060),
      sipTransport: this.config.get<string>('ASTERISK_SIP_TRANSPORT', 'UDP'),
    };
  }

  private async checkDatabase(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }

  private async checkRedis(): Promise<boolean> {
    const Redis = (await import('ioredis')).default;
    const client = new Redis({
      host: this.config.get<string>('REDIS_HOST', '127.0.0.1'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
      connectTimeout: 500,
      maxRetriesPerRequest: 0,
    });
    try {
      await client.connect();
      const pong = await client.ping();
      return pong === 'PONG';
    } catch {
      return false;
    } finally {
      client.disconnect();
    }
  }
}

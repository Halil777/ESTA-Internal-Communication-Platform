import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AsteriskService } from './sip/asterisk.service';

@Controller()
export class AppController {
  constructor(
    private dataSource: DataSource,
    private asteriskService: AsteriskService,
  ) {}

  @Get()
  ping() {
    return { status: 'ok', app: 'Esta Connect API', version: '1.0.0' };
  }

  @Get('health')
  async health() {
    let database = false;
    try {
      await this.dataSource.query('SELECT 1');
      database = true;
    } catch {
      database = false;
    }

    return {
      status: database && this.asteriskService.isConnected() ? 'ok' : 'degraded',
      database: database ? 'up' : 'down',
      asterisk: this.asteriskService.isConnected() ? 'up' : 'down',
      ami: this.asteriskService.isConnected() ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}

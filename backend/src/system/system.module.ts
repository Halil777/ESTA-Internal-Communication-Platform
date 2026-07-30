import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemController } from './system.controller';
import { User } from '../users/entities/user.entity';
import { Device } from '../devices/entities/device.entity';
import { Extension } from '../extensions/entities/extension.entity';
import { SipModule } from '../sip/sip.module';
import { WebsocketModule } from '../websocket/websocket.module';
import { CallsModule } from '../calls/calls.module';
import { RecordingsModule } from '../recordings/recordings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Device, Extension]),
    SipModule,
    WebsocketModule,
    CallsModule,
    RecordingsModule,
  ],
  controllers: [SystemController],
})
export class SystemModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SipService } from './sip.service';
import { AsteriskService } from './asterisk.service';
import { SipAccount } from './entities/sip-account.entity';
import { PjsipRealtimeService } from '../asterisk/realtime/pjsip-realtime.service';
import {
  PjsipAor,
  PjsipAuth,
  PjsipContact,
  PjsipDomainAlias,
  PjsipEndpoint,
  PjsipEndpointIdIp,
  PjsipGlobal,
  PjsipRegistration,
  PjsipSubscriptionPersistence,
  PjsipTransport,
} from '../asterisk/realtime/entities/pjsip-realtime.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SipAccount,
      PjsipEndpoint,
      PjsipAuth,
      PjsipAor,
      PjsipContact,
      PjsipEndpointIdIp,
      PjsipTransport,
      PjsipRegistration,
      PjsipDomainAlias,
      PjsipGlobal,
      PjsipSubscriptionPersistence,
    ]),
  ],
  providers: [SipService, AsteriskService, PjsipRealtimeService],
  exports: [SipService, AsteriskService, PjsipRealtimeService],
})
export class SipModule {}

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import {
  PjsipAor,
  PjsipAuth,
  PjsipContact,
  PjsipEndpoint,
  PjsipTransport,
} from './entities/pjsip-realtime.entity';

export interface ProvisionRealtimeEndpointOptions {
  extension: string;
  password: string;
  displayName?: string;
  context?: string;
  transport?: string;
  codecs?: string;
  maxContacts?: number;
}

@Injectable()
export class PjsipRealtimeService {
  constructor(
    @InjectRepository(PjsipEndpoint)
    private endpointsRepo: Repository<PjsipEndpoint>,
    @InjectRepository(PjsipAuth)
    private authsRepo: Repository<PjsipAuth>,
    @InjectRepository(PjsipAor)
    private aorsRepo: Repository<PjsipAor>,
    @InjectRepository(PjsipContact)
    private contactsRepo: Repository<PjsipContact>,
    @InjectRepository(PjsipTransport)
    private transportsRepo: Repository<PjsipTransport>,
    private config: ConfigService,
  ) {}

  async upsertInternalEndpoint(options: ProvisionRealtimeEndpointOptions) {
    const extension = options.extension;
    const authId = this.authIdFor(extension);
    const transportId = this.transportSectionFor(options.transport ?? 'UDP');

    await this.upsertUdpTransport(transportId);

    await this.authsRepo.save(
      this.authsRepo.create({
        id: authId,
        authType: 'userpass',
        username: extension,
        password: options.password,
        nonceLifetime: 32,
      }),
    );

    await this.aorsRepo.save(
      this.aorsRepo.create({
        id: extension,
        maxContacts: options.maxContacts ?? this.getNumberConfig('ASTERISK_PJSIP_MAX_CONTACTS', 5),
        removeExisting: 'no',
        qualifyFrequency: this.getNumberConfig('ASTERISK_PJSIP_QUALIFY_FREQUENCY', 30),
        qualifyTimeout: 3,
        authenticateQualify: 'no',
        supportPath: 'yes',
      }),
    );

    await this.endpointsRepo.save(
      this.endpointsRepo.create({
        id: extension,
        transport: transportId,
        aors: extension,
        auth: authId,
        context: options.context ?? 'internal',
        disallow: 'all',
        allow: options.codecs ?? this.config.get<string>('ASTERISK_ALLOWED_CODECS', 'opus,g722,ulaw,alaw'),
        directMedia: 'no',
        rewriteContact: 'yes',
        forceRport: 'yes',
        rtpSymmetric: 'yes',
        iceSupport: 'yes',
        dtmfMode: 'rfc4733',
        callerid: options.displayName
          ? `${options.displayName} <${extension}>`
          : `<${extension}>`,
        webRtc: 'no',
        mediaEncryption: 'no',
        deviceStateBusyAt: 1,
        allowSubscribe: 'yes',
        sendPai: 'yes',
        sendRpid: 'yes',
        trustIdInbound: 'yes',
        trustIdOutbound: 'yes',
      }),
    );
  }

  async removeEndpoint(extension: string) {
    await Promise.all([
      this.endpointsRepo.delete({ id: extension }),
      this.aorsRepo.delete({ id: extension }),
      this.authsRepo.delete({ id: this.authIdFor(extension) }),
      this.authsRepo.delete({ id: `${extension}-auth` }),
      this.contactsRepo.delete({ endpoint: extension }),
    ]);
  }

  async getEndpointStatus(extension: string) {
    const [endpoint, contacts] = await Promise.all([
      this.endpointsRepo.findOne({ where: { id: extension } }),
      this.contactsRepo.find({
        where: [{ endpoint: extension }, { id: Like(`${extension};%`) }],
      }),
    ]);

    const nowSeconds = Math.floor(Date.now() / 1000);
    const activeContacts = contacts.filter((contact) => {
      const expiration = Number(contact.expirationTime);
      return !Number.isFinite(expiration) || expiration === 0 || expiration > nowSeconds;
    });

    return {
      extension,
      provisioned: !!endpoint,
      registered: activeContacts.length > 0,
      contactCount: activeContacts.length,
      contacts: activeContacts.map((contact) => ({
        id: contact.id,
        uri: contact.uri,
        userAgent: contact.userAgent,
        viaAddr: contact.viaAddr,
        viaPort: contact.viaPort,
        expirationTime: contact.expirationTime,
      })),
    };
  }

  authIdFor(extension: string): string {
    return `auth-${extension}`;
  }

  private async upsertUdpTransport(transportId: string) {
    if (transportId !== 'transport-udp') return;

    await this.transportsRepo.save(
      this.transportsRepo.create({
        id: transportId,
        protocol: 'udp',
        bind: '0.0.0.0:5060',
        externalMediaAddress: this.config.get<string>('ASTERISK_SIP_DOMAIN', '10.10.20.231'),
        externalSignalingAddress: this.config.get<string>('ASTERISK_SIP_DOMAIN', '10.10.20.231'),
        localNet: this.config.get<string>('ASTERISK_LOCAL_NET', '10.10.20.0/24'),
        method: 'unspecified',
        verifyClient: 'no',
        verifyServer: 'no',
      }),
    );
  }

  private transportSectionFor(transport: string): string {
    const configured = this.config.get<string>('ASTERISK_PJSIP_TRANSPORT_SECTION');
    if (configured) return configured;
    return `transport-${transport.toLowerCase()}`;
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = this.config.get<string | number>(key);
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
}

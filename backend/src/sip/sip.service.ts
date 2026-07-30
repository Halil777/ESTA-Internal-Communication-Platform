import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { SipAccount } from './entities/sip-account.entity';
import { AsteriskService } from './asterisk.service';
import { PjsipRealtimeService } from '../asterisk/realtime/pjsip-realtime.service';

@Injectable()
export class SipService {
  private readonly logger = new Logger(SipService.name);
  private readonly encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-cbc';

  constructor(
    @InjectRepository(SipAccount)
    private sipAccountRepo: Repository<SipAccount>,
    private asteriskService: AsteriskService,
    private pjsipRealtimeService: PjsipRealtimeService,
    private config: ConfigService,
  ) {
    const key = this.config.get<string>(
      'SIP_ENCRYPTION_KEY',
      'EstaConnect32CharEncryptionKey!!',
    );
    this.encryptionKey = Buffer.from(
      key.padEnd(32, '0').substring(0, 32),
      'utf8',
    );
  }

  async createAccount(
    userId: string,
    extensionNumber: string,
    displayName?: string,
  ): Promise<SipAccount> {
    const sipDomain = this.config.get<string>(
      'ASTERISK_SIP_DOMAIN',
      '10.10.20.1',
    );
    const transport = this.config
      .get<string>('ASTERISK_SIP_TRANSPORT', 'UDP')
      .toUpperCase();
    const port = this.config.get<number>(
      'ASTERISK_SIP_PORT',
      transport === 'TLS' ? 5061 : 5060,
    );

    // Generate strong SIP password
    const sipPassword = this.generateSipPassword();
    const encrypted = this.encryptPassword(sipPassword);

    // Upsert SIP account
    let account = await this.sipAccountRepo.findOne({ where: { userId } });
    if (!account) {
      account = this.sipAccountRepo.create({ userId });
    }
    account.sipUsername = extensionNumber;
    account.sipPasswordEncrypted = encrypted;
    account.sipDomain = sipDomain;
    account.extensionNumber = extensionNumber;
    account.transport = transport;
    account.port = port;
    account.isActive = true;

    const saved = await this.sipAccountRepo.save(account);

    await this.provisionEndpoint(
      extensionNumber,
      sipPassword,
      transport,
      displayName,
    );

    this.logger.log(`SIP account created for extension ${extensionNumber}`);
    return saved;
  }

  async removeAccount(userId: string) {
    const account = await this.sipAccountRepo.findOne({ where: { userId } });
    if (!account) return;

    await Promise.all([
      this.shouldProvisionAmi()
        ? this.asteriskService.removeEndpoint(account.extensionNumber)
        : Promise.resolve(),
      this.shouldProvisionRealtime()
        ? this.pjsipRealtimeService.removeEndpoint(account.extensionNumber)
        : Promise.resolve(),
    ]);
    account.isActive = false;
    await this.sipAccountRepo.save(account);
    this.logger.log(`SIP account deactivated for user ${userId}`);
  }

  async resetSecretForExtension(extensionNumber: string) {
    const account = await this.sipAccountRepo.findOne({
      where: { extensionNumber, isActive: true },
    });
    if (!account) throw new NotFoundException('SIP account not found');

    const sipPassword = this.generateSipPassword();
    account.sipPasswordEncrypted = this.encryptPassword(sipPassword);
    await this.sipAccountRepo.save(account);

    await this.provisionEndpoint(
      account.extensionNumber,
      sipPassword,
      account.transport,
    );

    return {
      extension: account.extensionNumber,
      username: account.sipUsername,
      password: sipPassword,
      domain: account.sipDomain,
      transport: account.transport,
      port: account.port,
    };
  }

  async getProvisioningForUser(userId: string) {
    const account = await this.sipAccountRepo
      .createQueryBuilder('sip')
      .addSelect('sip.sipPasswordEncrypted')
      .where('sip.userId = :userId', { userId })
      .andWhere('sip.isActive = true')
      .getOne();

    if (!account) throw new NotFoundException('SIP account not found');

    const decryptedPassword = this.decryptPassword(
      account.sipPasswordEncrypted,
    );
    await this.provisionEndpoint(
      account.extensionNumber,
      decryptedPassword,
      account.transport,
    );

    return {
      username: account.sipUsername,
      password: decryptedPassword,
      domain: account.sipDomain,
      extension: account.extensionNumber,
      transport: account.transport,
      port: account.port,
      stunServer: null,
    };
  }

  async getEndpointStatus(extensionNumber: string) {
    const [realtime, ami] = await Promise.all([
      this.shouldProvisionRealtime()
        ? this.pjsipRealtimeService.getEndpointStatus(extensionNumber)
        : Promise.resolve(null),
      this.asteriskService.getEndpointRuntimeStatus(extensionNumber),
    ]);

    return {
      extension: extensionNumber,
      realtime,
      ami,
      registered: Boolean(realtime?.registered || ami.registered),
      contactCount: Math.max(realtime?.contactCount ?? 0, ami.contactCount),
    };
  }

  encryptPassword(plaintext: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
  }

  decryptPassword(ciphertext: string): string {
    const [ivHex, encryptedHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.encryptionKey,
      iv,
    );
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final(),
    ]).toString('utf8');
  }

  private generateSipPassword(): string {
    return crypto.randomBytes(24).toString('base64url');
  }

  private async provisionEndpoint(
    extensionNumber: string,
    sipPassword: string,
    transport: string,
    displayName?: string,
  ) {
    const tasks: Promise<unknown>[] = [];

    if (this.shouldProvisionRealtime()) {
      tasks.push(
        this.pjsipRealtimeService.upsertInternalEndpoint({
          extension: extensionNumber,
          password: sipPassword,
          transport,
          displayName,
        }),
      );
    }

    if (this.shouldProvisionAmi()) {
      tasks.push(
        this.asteriskService.createOrUpdateEndpoint(
          extensionNumber,
          sipPassword,
          transport,
          displayName,
        ),
      );
    }

    await Promise.all(tasks);
  }

  private shouldProvisionRealtime(): boolean {
    const mode = this.config
      .get<string>('ASTERISK_PROVISIONING_MODE', 'both')
      .toLowerCase();
    return mode === 'realtime' || mode === 'both';
  }

  private shouldProvisionAmi(): boolean {
    const mode = this.config
      .get<string>('ASTERISK_PROVISIONING_MODE', 'both')
      .toLowerCase();
    return mode === 'ami' || mode === 'both';
  }
}

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Extension, ExtensionStatus } from './entities/extension.entity';
import {
  AssignExtensionDto,
  ForwardExtensionDto,
  ReserveExtensionDto,
  UpdateExtensionPolicyDto,
} from './dto/extension.dto';
import { SipService } from '../sip/sip.service';
import { User } from '../users/entities/user.entity';

// Reserved extensions that cannot be freely assigned
const RESERVED_EXTENSIONS = new Set(['000', '911', '999']);

@Injectable()
export class ExtensionsService {
  constructor(
    @InjectRepository(Extension)
    private extensionsRepo: Repository<Extension>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    private sipService: SipService,
  ) {}

  async findAll() {
    return this.extensionsRepo.find({
      relations: ['user', 'user.department'],
      order: { extensionNumber: 'ASC' },
    });
  }

  async findOne(extensionNumber: string) {
    const ext = await this.extensionsRepo.findOne({
      where: { extensionNumber },
      relations: ['user', 'user.department'],
    });
    if (!ext)
      throw new NotFoundException(`Extension ${extensionNumber} not found`);
    return ext;
  }

  async assign(dto: AssignExtensionDto) {
    if (RESERVED_EXTENSIONS.has(dto.extensionNumber)) {
      throw new BadRequestException(
        `Extension ${dto.extensionNumber} is reserved and cannot be assigned`,
      );
    }

    const user = await this.usersRepo.findOne({
      where: { id: dto.userId, isActive: true },
    });
    if (!user) throw new NotFoundException(`User ${dto.userId} not found`);

    // Check if already taken by another user
    const existing = await this.extensionsRepo.findOne({
      where: { extensionNumber: dto.extensionNumber },
    });

    if (existing && existing.userId && existing.userId !== dto.userId) {
      throw new ConflictException(
        `Extension ${dto.extensionNumber} is already assigned to another user`,
      );
    }

    // Release previous extension for this user
    const userCurrentExt = await this.extensionsRepo.findOne({
      where: { userId: dto.userId },
    });
    if (
      userCurrentExt &&
      userCurrentExt.extensionNumber !== dto.extensionNumber
    ) {
      await this.release(userCurrentExt.extensionNumber);
    }

    const extension = existing ?? this.extensionsRepo.create();
    extension.extensionNumber = dto.extensionNumber;
    extension.userId = dto.userId;
    extension.displayName =
      dto.displayName ?? `${user.firstName} ${user.lastName}`.trim();
    extension.sipUsername = dto.extensionNumber;
    extension.context = 'internal';
    extension.status = ExtensionStatus.ACTIVE;
    extension.isReserved = false;
    extension.assignedAt = new Date();
    extension.releasedAt = null;
    if (dto.allowIncomingCalls !== undefined)
      extension.allowIncomingCalls = dto.allowIncomingCalls;
    if (dto.allowOutgoingCalls !== undefined)
      extension.allowOutgoingCalls = dto.allowOutgoingCalls;
    if (dto.allowBroadcast !== undefined)
      extension.allowBroadcast = dto.allowBroadcast;
    if (dto.recordCalls !== undefined) extension.recordCalls = dto.recordCalls;
    if (dto.allowInternal !== undefined)
      extension.allowInternal = dto.allowInternal;
    if (dto.allowExternal !== undefined)
      extension.allowExternal = dto.allowExternal;
    if (dto.allowedCodecs !== undefined)
      extension.allowedCodecs = dto.allowedCodecs;

    const saved = await this.extensionsRepo.save(extension);

    // Create SIP account in Asterisk
    await this.sipService.createAccount(
      dto.userId,
      dto.extensionNumber,
      extension.displayName,
    );

    return saved;
  }

  async release(extensionNumber: string) {
    const ext = await this.findOne(extensionNumber);
    const userId = ext.userId;

    await this.extensionsRepo.update(
      { extensionNumber },
      {
        userId: null,
        status: ExtensionStatus.INACTIVE,
        releasedAt: new Date(),
      },
    );

    // Remove SIP account from Asterisk
    if (userId) {
      await this.sipService.removeAccount(userId);
    }
  }

  async reserve(dto: ReserveExtensionDto) {
    const existing = await this.extensionsRepo.findOne({
      where: { extensionNumber: dto.extensionNumber },
    });
    if (existing?.userId) {
      throw new ConflictException(
        `Extension ${dto.extensionNumber} is currently assigned to a user`,
      );
    }

    const extension = existing ?? this.extensionsRepo.create();
    extension.extensionNumber = dto.extensionNumber;
    extension.isReserved = true;
    extension.reservedFor = dto.reservedFor;
    extension.sipUsername = null;
    extension.status = ExtensionStatus.RESERVED;
    return this.extensionsRepo.save(extension);
  }

  async disable(extensionNumber: string) {
    const ext = await this.findOne(extensionNumber);
    ext.status = ExtensionStatus.DISABLED;
    return this.extensionsRepo.save(ext);
  }

  async enable(extensionNumber: string) {
    const ext = await this.findOne(extensionNumber);
    ext.status = ExtensionStatus.ACTIVE;
    return this.extensionsRepo.save(ext);
  }

  async setCallForwarding(extensionNumber: string, dto: ForwardExtensionDto) {
    const ext = await this.findOne(extensionNumber);
    ext.forwardTo = dto.forwardTo ?? null;
    return this.extensionsRepo.save(ext);
  }

  async updatePolicy(extensionNumber: string, dto: UpdateExtensionPolicyDto) {
    const ext = await this.findOne(extensionNumber);
    Object.assign(ext, {
      displayName: dto.displayName ?? ext.displayName,
      allowIncomingCalls:
        dto.allowIncomingCalls ?? ext.allowIncomingCalls,
      allowOutgoingCalls:
        dto.allowOutgoingCalls ?? ext.allowOutgoingCalls,
      allowInternal: dto.allowInternal ?? ext.allowInternal,
      allowExternal: dto.allowExternal ?? ext.allowExternal,
      recordCalls: dto.recordCalls ?? ext.recordCalls,
      allowedCodecs: dto.allowedCodecs ?? ext.allowedCodecs,
    });
    return this.extensionsRepo.save(ext);
  }

  async resetSecret(extensionNumber: string) {
    const ext = await this.findOne(extensionNumber);
    if (!ext.userId) {
      throw new BadRequestException('Extension is not assigned to a user');
    }
    return this.sipService.resetSecretForExtension(extensionNumber);
  }

  async getStatus(extensionNumber: string) {
    const ext = await this.findOne(extensionNumber);
    const sip = await this.sipService.getEndpointStatus(extensionNumber);
    return {
      extensionNumber,
      enabled: ext.status === ExtensionStatus.ACTIVE,
      status: ext.status,
      userId: ext.userId,
      sipUsername: ext.sipUsername,
      registered: sip.registered,
      contactCount: sip.contactCount,
      sip,
    };
  }

  async remove(extensionNumber: string) {
    const ext = await this.findOne(extensionNumber);
    if (ext.userId) await this.release(extensionNumber);
    await this.extensionsRepo.delete({ extensionNumber });
  }

  async isAvailable(extensionNumber: string): Promise<boolean> {
    if (RESERVED_EXTENSIONS.has(extensionNumber)) return false;
    const existing = await this.extensionsRepo.findOne({
      where: { extensionNumber },
    });
    return !existing || (!existing.userId && !existing.isReserved);
  }
}

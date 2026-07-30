import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Call, CallDirection, CallStatus } from './entities/call.entity';
import { AsteriskService } from '../sip/asterisk.service';

export class SaveCallDto {
  callerUserId?: string;
  calleeUserId?: string;
  asteriskUniqueId?: string;
  linkedId?: string;
  callerExtension: string;
  calleeExtension: string;
  direction: CallDirection;
  status: CallStatus;
  startedAt: Date;
  answeredAt?: Date;
  endedAt?: Date;
  durationSeconds?: number;
  billableSeconds?: number;
  hangupCause?: string;
  recordingId?: string;
  failureReason?: string;
}

export interface AdminHistoryParams {
  limit?: number;
  direction?: string;
  status?: string;
  extension?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class CallsService {
  constructor(
    @InjectRepository(Call)
    private callsRepo: Repository<Call>,
    private asteriskService: AsteriskService,
  ) {}

  async getHistory(userId: string, limit = 100) {
    return this.callsRepo.find({
      where: [{ callerUserId: userId }, { calleeUserId: userId }],
      relations: ['callerUser', 'calleeUser'],
      order: { startedAt: 'DESC' },
      take: limit,
    });
  }

  async getMissed(userId: string) {
    return this.callsRepo.find({
      where: { calleeUserId: userId, status: CallStatus.MISSED },
      relations: ['callerUser'],
      order: { startedAt: 'DESC' },
      take: 50,
    });
  }

  async getAdminHistory(params: AdminHistoryParams) {
    const where: Record<string, any> = {};
    if (params.direction) where.direction = params.direction;
    if (params.status) where.status = params.status;
    if (params.from && params.to) {
      where.startedAt = Between(new Date(params.from), new Date(params.to));
    }

    if (params.extension) {
      const query = this.callsRepo
        .createQueryBuilder('call')
        .leftJoinAndSelect('call.callerUser', 'callerUser')
        .leftJoinAndSelect('call.calleeUser', 'calleeUser')
        .where('call.callerExtension = :extension OR call.calleeExtension = :extension', {
          extension: params.extension,
        });

      if (params.direction) {
        query.andWhere('call.direction = :direction', {
          direction: params.direction,
        });
      }
      if (params.status) {
        query.andWhere('call.status = :status', { status: params.status });
      }
      if (params.from && params.to) {
        query.andWhere('call.startedAt BETWEEN :from AND :to', {
          from: new Date(params.from),
          to: new Date(params.to),
        });
      }

      return query
        .orderBy('call.startedAt', 'DESC')
        .take(params.limit ?? 200)
        .getMany();
    }

    return this.callsRepo.find({
      where,
      relations: ['callerUser', 'calleeUser'],
      order: { startedAt: 'DESC' },
      take: params.limit ?? 200,
    });
  }

  async save(dto: SaveCallDto) {
    const call = this.callsRepo.create({
      callUuid: uuidv4(),
      ...dto,
      sourceExtension: dto.callerExtension,
      destinationExtension: dto.calleeExtension,
      durationSeconds: dto.durationSeconds ?? 0,
      billableSeconds: dto.billableSeconds ?? dto.durationSeconds ?? 0,
    });
    return this.callsRepo.save(call);
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const total = await this.callsRepo.count();
    const callsToday = await this.callsRepo.count({
      where: { startedAt: MoreThanOrEqual(today) },
    });
    const missedToday = await this.callsRepo.count({
      where: { startedAt: MoreThanOrEqual(today), status: CallStatus.MISSED },
    });
    const missed = await this.callsRepo.count({
      where: { status: CallStatus.MISSED },
    });
    const completed = await this.callsRepo.count({
      where: { status: CallStatus.COMPLETED },
    });
    const avgRaw = await this.callsRepo
      .createQueryBuilder('call')
      .select('AVG(call.durationSeconds)', 'avg')
      .where('call.status = :status', { status: CallStatus.COMPLETED })
      .getRawOne<{ avg: string | null }>();

    return {
      total,
      today: callsToday,
      missed,
      missedToday,
      completed,
      averageDurationSeconds: Math.round(Number(avgRaw?.avg ?? 0)),
    };
  }

  async getLiveCalls() {
    return this.asteriskService.getLiveChannels();
  }
}

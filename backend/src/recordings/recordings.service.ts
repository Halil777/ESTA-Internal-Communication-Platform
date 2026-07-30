import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Recording } from './entities/recording.entity';

export interface RecordingListParams {
  limit?: number;
  extension?: string;
  from?: string;
  to?: string;
}

@Injectable()
export class RecordingsService {
  constructor(
    @InjectRepository(Recording)
    private recordingsRepo: Repository<Recording>,
  ) {}

  async findAll(params: RecordingListParams) {
    if (params.extension) {
      const query = this.recordingsRepo
        .createQueryBuilder('recording')
        .where(
          'recording.callerExtension = :extension OR recording.calleeExtension = :extension',
          { extension: params.extension },
        );

      if (params.from && params.to) {
        query.andWhere('recording.startedAt BETWEEN :from AND :to', {
          from: new Date(params.from),
          to: new Date(params.to),
        });
      }

      return query
        .orderBy('recording.startedAt', 'DESC')
        .take(params.limit ?? 200)
        .getMany();
    }

    const where: Record<string, unknown> = {};
    if (params.from && params.to) {
      where.startedAt = Between(new Date(params.from), new Date(params.to));
    }

    return this.recordingsRepo.find({
      where,
      order: { startedAt: 'DESC' },
      take: params.limit ?? 200,
    });
  }

  async findOne(id: string) {
    const recording = await this.recordingsRepo.findOne({ where: { id } });
    if (!recording) throw new NotFoundException(`Recording ${id} not found`);
    return recording;
  }

  async getStats() {
    const total = await this.recordingsRepo.count();
    const sizeRaw = await this.recordingsRepo
      .createQueryBuilder('recording')
      .select('SUM(recording.sizeBytes)', 'bytes')
      .getRawOne<{ bytes: string | null }>();

    return {
      total,
      sizeBytes: Number(sizeRaw?.bytes ?? 0),
    };
  }
}

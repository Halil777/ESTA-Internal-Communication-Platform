import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './audit-log.entity';

export interface AuditLogDto {
  adminUserId?: string;
  action: string;
  entityType?: string;
  entityId?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditRepo: Repository<AuditLog>,
  ) {}

  async log(dto: AuditLogDto) {
    const entry = this.auditRepo.create(dto);
    await this.auditRepo.save(entry).catch(() => {}); // never throw from audit
  }

  async findAll(limit = 200) {
    return this.auditRepo.find({
      relations: ['adminUser'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}

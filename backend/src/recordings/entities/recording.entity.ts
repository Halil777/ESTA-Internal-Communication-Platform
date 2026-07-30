import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';

export enum RecordingStatus {
  AVAILABLE = 'AVAILABLE',
  ARCHIVED = 'ARCHIVED',
  DELETED = 'DELETED',
  FAILED = 'FAILED',
}

@Entity('recordings')
@Index(['startedAt'])
@Index(['callerExtension', 'startedAt'])
@Index(['calleeExtension', 'startedAt'])
export class Recording extends BaseEntity {
  @Column({ nullable: true })
  callId: string;

  @Column({ nullable: true })
  linkedId: string;

  @Column({ nullable: true })
  asteriskUniqueId: string;

  @Column({ length: 10 })
  callerExtension: string;

  @Column({ length: 10 })
  calleeExtension: string;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  endedAt: Date;

  @Column({ default: 0 })
  durationSeconds: number;

  @Column({ type: 'text' })
  filePath: string;

  @Column({ length: 255 })
  fileName: string;

  @Column({ default: 'wav', length: 20 })
  format: string;

  @Column({ default: 0, type: 'bigint' })
  sizeBytes: string;

  @Column({
    type: 'enum',
    enum: RecordingStatus,
    default: RecordingStatus.AVAILABLE,
  })
  status: RecordingStatus;

  @Column({ nullable: true, type: 'timestamptz' })
  retentionUntil: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  deletedAt: Date;
}

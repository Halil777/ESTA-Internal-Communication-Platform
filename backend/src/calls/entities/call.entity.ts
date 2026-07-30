import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum CallDirection {
  INCOMING = 'INCOMING',
  OUTGOING = 'OUTGOING',
  INTERNAL = 'INTERNAL',
}

export enum CallStatus {
  INITIATED = 'INITIATED',
  RINGING = 'RINGING',
  ANSWERED = 'ANSWERED',
  COMPLETED = 'COMPLETED',
  MISSED = 'MISSED',
  REJECTED = 'REJECTED',
  BUSY = 'BUSY',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT',
  FAILED = 'FAILED',
}

@Entity('calls')
@Index(['callerUserId', 'startedAt'])
@Index(['calleeUserId', 'startedAt'])
export class Call extends BaseEntity {
  @Column({ unique: true })
  callUuid: string;

  @Column({ nullable: true, unique: true })
  asteriskUniqueId: string;

  @Column({ nullable: true })
  linkedId: string;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'callerUserId' })
  callerUser: User;

  @Column({ nullable: true })
  callerUserId: string;

  @ManyToOne(() => User, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'calleeUserId' })
  calleeUser: User;

  @Column({ nullable: true })
  calleeUserId: string;

  @Column({ length: 10 })
  callerExtension: string;

  @Column({ length: 10 })
  calleeExtension: string;

  @Column({ nullable: true, length: 10 })
  sourceExtension: string;

  @Column({ nullable: true, length: 10 })
  destinationExtension: string;

  @Column({ type: 'enum', enum: CallDirection })
  direction: CallDirection;

  @Column({ type: 'enum', enum: CallStatus, default: CallStatus.MISSED })
  status: CallStatus;

  @Column({ type: 'timestamptz' })
  startedAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  answeredAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  endedAt: Date;

  @Column({ default: 0 })
  durationSeconds: number;

  @Column({ default: 0 })
  billableSeconds: number;

  @Column({ nullable: true, length: 80 })
  hangupCause: string;

  @Column({ nullable: true })
  recordingId: string;

  @Column({ nullable: true, length: 200 })
  failureReason: string;
}

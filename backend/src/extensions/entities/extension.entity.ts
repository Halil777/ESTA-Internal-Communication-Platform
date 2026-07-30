import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

export enum ExtensionStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  RESERVED = 'RESERVED',
  DISABLED = 'DISABLED',
}

@Entity('extensions')
export class Extension extends BaseEntity {
  @Column({ unique: true, length: 10 })
  @Index()
  extensionNumber: string;

  @Column({
    type: 'enum',
    enum: ExtensionStatus,
    default: ExtensionStatus.ACTIVE,
  })
  status: ExtensionStatus;

  @Column({ default: false })
  isReserved: boolean;

  @Column({ nullable: true })
  reservedFor: string;

  @Column({ nullable: true, length: 160 })
  displayName: string;

  @Column({ nullable: true, unique: true, length: 50 })
  @Index()
  sipUsername: string;

  @Column({ default: 'internal', length: 80 })
  context: string;

  @Column({ nullable: true, type: 'timestamptz' })
  assignedAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  releasedAt: Date;

  @Column({ default: true })
  allowIncomingCalls: boolean;

  @Column({ default: true })
  allowOutgoingCalls: boolean;

  @Column({ default: true })
  allowInternal: boolean;

  @Column({ default: false })
  allowExternal: boolean;

  @Column({ default: true })
  allowGroupCalls: boolean;

  @Column({ default: false })
  allowBroadcast: boolean;

  @Column({ default: false })
  recordCalls: boolean;

  @Column({ default: 'opus,g722,ulaw,alaw', length: 200 })
  allowedCodecs: string;

  // Call forwarding
  @Column({ nullable: true, length: 10 })
  forwardTo: string;

  @OneToOne(() => User, (user) => user.extension, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;

  @Column({ nullable: true })
  userId: string;
}

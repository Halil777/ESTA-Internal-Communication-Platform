import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Extension } from '../../extensions/entities/extension.entity';

export enum DeviceStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
  PENDING = 'PENDING',
}

@Entity('devices')
export class Device extends BaseEntity {
  @Column({ unique: true })
  @Index()
  deviceUuid: string;

  @Column({ length: 100 })
  brand: string;

  @Column({ length: 100 })
  model: string;

  @Column({ nullable: true, length: 120 })
  deviceName: string;

  @Column({ default: 'ANDROID_PHONE', length: 40 })
  deviceType: string;

  @Column({ default: 'ANDROID', length: 40 })
  platform: string;

  @Column({ length: 20 })
  androidVersion: string;

  @Column({ length: 30 })
  appVersion: string;

  @Column({ nullable: true, type: 'text' })
  pushToken: string;

  @Column({ nullable: true, length: 45 })
  lastIp: string;

  @Column({ nullable: true, length: 45 })
  lastIpAddress: string;

  @Column({ nullable: true, length: 100 })
  wifiSsid: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastSeenAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  lastRegistrationAt: Date;

  @Column({ nullable: true })
  sipRegistered: boolean;

  @Column({ default: false })
  registered: boolean;

  @Column({
    type: 'enum',
    enum: DeviceStatus,
    default: DeviceStatus.ACTIVE,
  })
  status: DeviceStatus;

  @ManyToOne(() => User, { nullable: false, eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @ManyToOne(() => Extension, { nullable: true, eager: false, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'extensionId' })
  extension: Extension;

  @Column({ nullable: true })
  extensionId: string;

  @Column({ nullable: true, type: 'timestamptz' })
  revokedAt: Date;
}

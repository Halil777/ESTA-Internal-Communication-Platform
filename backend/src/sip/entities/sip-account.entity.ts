import { Entity, Column, OneToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('sip_accounts')
export class SipAccount extends BaseEntity {
  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  userId: string;

  @Column({ unique: true, length: 50 })
  sipUsername: string;

  // Encrypted SIP password
  @Column({ type: 'text', select: false })
  sipPasswordEncrypted: string;

  @Column({ length: 100 })
  sipDomain: string;

  @Column({ length: 10 })
  extensionNumber: string;

  @Column({ default: 'TLS', length: 10 })
  transport: string;

  @Column({ default: 5061 })
  port: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamptz' })
  lastRegisteredAt: Date;
}

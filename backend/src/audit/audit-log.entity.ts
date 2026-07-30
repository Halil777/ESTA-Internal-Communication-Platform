import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/entities/user.entity';

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'adminUserId' })
  adminUser: User;

  @Column({ nullable: true })
  adminUserId: string;

  @Column({ length: 200 })
  action: string;

  @Column({ nullable: true, length: 100 })
  entityType: string;

  @Column({ nullable: true })
  entityId: string;

  @Column({ nullable: true, type: 'text' })
  oldValue: string;

  @Column({ nullable: true, type: 'text' })
  newValue: string;

  @Column({ nullable: true, length: 45 })
  ipAddress: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}

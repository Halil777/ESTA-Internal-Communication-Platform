import {
  Entity,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  Index,
  AfterLoad,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Department } from '../../departments/entities/department.entity';
import { Extension } from '../../extensions/entities/extension.entity';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OFFICE_ADMIN = 'OFFICE_ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
  RECEPTION = 'RECEPTION',
}

export enum UserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  BUSY = 'BUSY',
  IN_CALL = 'IN_CALL',
  DO_NOT_DISTURB = 'DO_NOT_DISTURB',
  AWAY = 'AWAY',
  MEETING = 'MEETING',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100 })
  firstName: string;

  @Column({ length: 100 })
  lastName: string;

  @Column({ unique: true, length: 50 })
  @Index()
  username: string;

  @Column({ unique: true, length: 50 })
  employeeId: string;

  @Column({ nullable: true, length: 200 })
  email: string;

  @Column({ select: false })
  passwordHash: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.EMPLOYEE })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.OFFLINE })
  status: UserStatus;

  @Column({ nullable: true, length: 20 })
  cabinet: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Department, (dept) => dept.users, {
    nullable: true,
    eager: false,
  })
  @JoinColumn({ name: 'departmentId' })
  department: Department;

  @Column({ nullable: true })
  departmentId: string;

  @OneToOne(() => Extension, (ext) => ext.user, {
    nullable: true,
    eager: false,
  })
  extension: Extension;

  // Computed field — populated after load for JSON serialization
  fullName: string;

  @AfterLoad()
  computeFullName() {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
}

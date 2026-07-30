import { Entity, Column, OneToMany } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';

@Entity('departments')
export class Department extends BaseEntity {
  @Column({ unique: true, length: 100 })
  name: string;

  @Column({ unique: true, length: 20 })
  code: string;

  @Column({ nullable: true })
  floor: number;

  @Column({ nullable: true, length: 10 })
  groupExtension: string;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.department)
  users: User[];
}

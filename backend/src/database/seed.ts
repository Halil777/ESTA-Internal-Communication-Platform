/**
 * Run: npx ts-node src/database/seed.ts
 * Seeds the first SuperAdmin user into the database.
 */
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { Department } from '../departments/entities/department.entity';
import {
  Extension,
  ExtensionStatus,
} from '../extensions/entities/extension.entity';
import { SipAccount } from '../sip/entities/sip-account.entity';
import { Device } from '../devices/entities/device.entity';
import { Call } from '../calls/entities/call.entity';
import { AuditLog } from '../audit/audit-log.entity';
import { Recording } from '../recordings/entities/recording.entity';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DATABASE_PORT ?? process.env.DB_PORT ?? 5432),
  database: process.env.DATABASE_NAME ?? process.env.DB_NAME ?? 'esta_connect',
  username: process.env.DATABASE_USER ?? process.env.DB_USER ?? 'postgres',
  password:
    process.env.DATABASE_PASSWORD ?? process.env.DB_PASS ?? 'QwertyWeb123321',
  entities: [
    User,
    Department,
    Extension,
    SipAccount,
    Device,
    Call,
    AuditLog,
    Recording,
  ],
  synchronize: true,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  const userRepo = AppDataSource.getRepository(User);
  const deptRepo = AppDataSource.getRepository(Department);
  const extRepo = AppDataSource.getRepository(Extension);

  // ── Departments ──────────────────────────────────────────────────────────
  const departments = [
    { name: 'Management', code: 'MGT', floor: 1, groupExtension: '100' },
    { name: 'IT', code: 'IT', floor: 2, groupExtension: '200' },
    { name: 'Accounting', code: 'ACC', floor: 1, groupExtension: '300' },
    { name: 'HR', code: 'HR', floor: 1, groupExtension: '400' },
    { name: 'Warehouse', code: 'WH', floor: 0, groupExtension: '500' },
    { name: 'Security', code: 'SEC', floor: 0, groupExtension: '600' },
  ];

  const savedDepts: Record<string, Department> = {};
  for (const d of departments) {
    let dept = await deptRepo.findOne({ where: { code: d.code } });
    if (!dept) {
      dept = await deptRepo.save(deptRepo.create(d));
      console.log(`Department created: ${d.name}`);
    }
    savedDepts[d.code] = dept;
  }

  // ── Super Admin ───────────────────────────────────────────────────────────
  const adminUsername = process.env.ADMIN_USERNAME ?? 'admin';
  let admin = await userRepo.findOne({ where: { username: adminUsername } });
  if (!admin) {
    const passwordHash = await bcrypt.hash(
      process.env.ADMIN_PASSWORD ?? 'Admin@123456',
      12,
    );
    admin = await userRepo.save(
      userRepo.create({
        firstName: 'Super',
        lastName: 'Admin',
        username: adminUsername,
        employeeId: 'EMP-000',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        departmentId: savedDepts['MGT'].id,
        isActive: true,
        status: UserStatus.OFFLINE,
      }),
    );
    console.log(`SuperAdmin created: ${adminUsername}`);
  }

  // ── Reserve special extensions ──────────────────────────────────────────
  const reservations = [
    { number: '000', note: 'Reception / Operator' },
    { number: '001', note: 'Director' },
    { number: '911', note: 'Emergency' },
  ];
  for (const r of reservations) {
    const exists = await extRepo.findOne({
      where: { extensionNumber: r.number },
    });
    if (!exists) {
      await extRepo.save(
        extRepo.create({
          extensionNumber: r.number,
          status: ExtensionStatus.RESERVED,
          isReserved: true,
          reservedFor: r.note,
        }),
      );
      console.log(`Extension reserved: ${r.number} (${r.note})`);
    }
  }

  console.log('\n✓ Seed complete!');
  console.log(
    `  Login: ${adminUsername} / ${process.env.ADMIN_PASSWORD ?? 'Admin@123456'}`,
  );
  console.log('  Swagger: http://localhost:3001/api/docs');

  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

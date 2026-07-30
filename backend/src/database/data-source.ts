import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const dbPort = Number(process.env.DATABASE_PORT ?? process.env.DB_PORT ?? 5432);

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? process.env.DB_HOST ?? 'localhost',
  port: Number.isFinite(dbPort) ? dbPort : 5432,
  database: process.env.DATABASE_NAME ?? process.env.DB_NAME ?? 'esta_connect',
  username: process.env.DATABASE_USER ?? process.env.DB_USER ?? 'postgres',
  password:
    process.env.DATABASE_PASSWORD ?? process.env.DB_PASS ?? 'QwertyWeb123321',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
  ssl: false,
});

import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExtensionsModule } from './extensions/extensions.module';
import { DevicesModule } from './devices/devices.module';
import { DepartmentsModule } from './departments/departments.module';
import { ContactsModule } from './contacts/contacts.module';
import { CallsModule } from './calls/calls.module';
import { SipModule } from './sip/sip.module';
import { WebsocketModule } from './websocket/websocket.module';
import { SystemModule } from './system/system.module';
import { AuditModule } from './audit/audit.module';
import { RecordingsModule } from './recordings/recordings.module';

@Module({
  imports: [
    // Config (global)
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const nodeEnv = config.get<string>('NODE_ENV', 'development');
        const synchronize = config.get<string>('DB_SYNCHRONIZE');

        return {
          type: 'postgres',
          host: config.get(
            'DATABASE_HOST',
            config.get('DB_HOST', 'localhost'),
          ),
          port: config.get<number>(
            'DATABASE_PORT',
            config.get<number>('DB_PORT', 5432),
          ),
          database: config.get(
            'DATABASE_NAME',
            config.get('DB_NAME', 'esta_connect'),
          ),
          username: config.get(
            'DATABASE_USER',
            config.get('DB_USER', 'postgres'),
          ),
          password: config.get(
            'DATABASE_PASSWORD',
            config.get('DB_PASS', 'QwertyWeb123321'),
          ),
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: synchronize === 'true',
          logging: nodeEnv === 'development',
          ssl: false,
        };
      },
    }),

    // Rate limiting
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 1000, limit: 20 },
      { name: 'medium', ttl: 10000, limit: 100 },
      { name: 'long', ttl: 60000, limit: 300 },
    ]),

    // Feature modules
    AuthModule,
    UsersModule,
    ExtensionsModule,
    DevicesModule,
    DepartmentsModule,
    ContactsModule,
    CallsModule,
    SipModule,
    WebsocketModule,
    SystemModule,
    AuditModule,
    RecordingsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

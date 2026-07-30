import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExtensionsController } from './extensions.controller';
import { ExtensionsService } from './extensions.service';
import { Extension } from './entities/extension.entity';
import { SipModule } from '../sip/sip.module';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Extension, User]), SipModule],
  controllers: [ExtensionsController],
  providers: [ExtensionsService],
  exports: [ExtensionsService, TypeOrmModule],
})
export class ExtensionsModule {}

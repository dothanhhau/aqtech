import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingController } from './controllers/setting.controller';
import { SettingService } from './services/setting.service';
import { UsersService } from '../users/services/users.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([], 'postgres')],
  controllers: [SettingController],
  providers: [ SettingService, UsersService, ConfigService ],
  exports: [SettingService],
})
export class SettingModule {}

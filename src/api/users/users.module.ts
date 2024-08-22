import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from '../media/services/media.service';
import { UsersController } from './controllers/users.controller';
import { UserProfile } from './mapper/user-profile.mapper';
import { UsersService } from './services/users.service';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([], 'postgres')],
  controllers: [UsersController],
  providers: [UsersService, UserProfile, ConfigService, MediaService, JwtService],
  exports: [UsersService],
})
export class UsersModule {}

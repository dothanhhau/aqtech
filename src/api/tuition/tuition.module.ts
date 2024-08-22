import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tuition } from '../../database/entity';
import { UsersService } from '../users/services/users.service';
import { TuitionController } from './controllers/tuition.controller';
import { TuitionService } from './services/tuition.service';
import { MediaService } from '../media/services/media.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Tuition], 'postgres')],
  controllers: [TuitionController],
  providers: [TuitionService, UsersService, MediaService, ConfigService],
})
export class TuitionModule {}

import { DatabaseModule } from '@/database/database.module';
import { Media } from '@/database/entity';
import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../users/services/users.service';
import { MediaController } from './controllers/media.controller';
import { MediaService } from './services/media.service';

@Global()
@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Media], 'postgres')],
  controllers: [MediaController],
  providers: [MediaService, UsersService],
  exports: [MediaService],
})
export class MediaModule {}

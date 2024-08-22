import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receipt } from '../../database/entity';
import { UsersService } from '../users/services/users.service';
import { MediaService } from '../media/services/media.service';
import { ConfigService } from '@nestjs/config';
import { ReceiptController } from './controllers/receipt.controller';
import { ReceiptService } from './services/receipt.service';
import { TuitionService } from '../tuition/services/tuition.service';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Receipt], 'postgres')],
  controllers: [ReceiptController],
  providers: [ReceiptService, UsersService, MediaService, ConfigService, TuitionService],
})
export class ReceiptModule {}

import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Device } from '../../database/entity';
// import { NotificationService } from '../notification/services/notification.service';
import { UsersService } from '../users/services/users.service';
import { DeviceController } from './controllers/device.controller';
import { DeviceService } from './services/device.service';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Device], 'postgres')],
  controllers: [DeviceController],
  providers: [DeviceService, UsersService],
})
export class DeviceModule {}

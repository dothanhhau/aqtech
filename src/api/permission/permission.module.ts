import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission } from '../../database/entity/permission.entity';
import { PermissionController } from './controllers/permission.controller';
import { PermissionService } from './services/permission.service';
import { UsersService } from '../users/services/users.service';
import { DatabaseModule } from '@/database/database.module';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Permission], 'postgres')],
  controllers: [PermissionController],
  providers: [PermissionService, UsersService],
})
export class PermissionModule {}

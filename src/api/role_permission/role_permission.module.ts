import { Module } from '@nestjs/common';
import { RolePermissionService } from './sevices/role_permission.service';
import { RolePermissionController } from './controllers/role_permission.controller';
import { RolePermission } from '@/database/entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from '@/database/database.module';
import { UsersService } from '../users/services/users.service';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([RolePermission], 'postgres')],
  controllers: [RolePermissionController],
  providers: [RolePermissionService, UsersService],
})
export class RolePermissionModule {}

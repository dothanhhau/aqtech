import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../../database/entity/role.entity';
import { UsersService } from '../users/services/users.service';
import { RoleController } from './controllers/role.controller';
import { RoleService } from './services/role.service';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Role], 'postgres')],
  controllers: [RoleController],
  providers: [RoleService, UsersService],
  exports: [RoleService],
})
export class RoleModule {}

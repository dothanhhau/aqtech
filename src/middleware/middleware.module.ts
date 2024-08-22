import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../api/users/services/users.service';
import { UsersModule } from '../api/users/users.module';
import { DatabaseModule } from '../database/database.module';
import { Permission, Role, UserRole, RolePermission, UserVerification } from '../database/entity';
import { User } from '../database/entity/user.entity';
import { LoggerMiddleware } from './middleware';

@Module({
  imports: [
    DatabaseModule.UserSharedOrmModule,
    TypeOrmModule.forFeature([User, Permission, Role, UserRole, RolePermission, UserVerification], 'postgres'),
    UsersModule,
  ],
  providers: [LoggerMiddleware, UsersService],
  exports: [LoggerMiddleware],
})
export class LoggerMiddlewareModule {}

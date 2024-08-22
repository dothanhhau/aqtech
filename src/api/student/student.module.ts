import { DatabaseModule } from '@/database/database.module';
import { Student } from '@/database/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentController } from './controllers/student.controller';
import { StudentService } from './services/student.service';
import { UsersService } from '../users/services/users.service';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Student], 'postgres')],
  controllers: [StudentController],
  providers: [StudentService, UsersService, ConfigService],
})
export class StudentModule {}

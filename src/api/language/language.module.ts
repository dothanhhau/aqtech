import { Module } from '@nestjs/common';
import { LanguageService } from './services/language.service';
import { LanguageController } from './controllers/language.controller';
import { DatabaseModule } from '@/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from '@/database/entity/language.entity';
import { UsersService } from '../users/services/users.service';

@Module({
  imports: [DatabaseModule.UserSharedOrmModule, TypeOrmModule.forFeature([Language], 'postgres')],
  controllers: [LanguageController],
  providers: [LanguageService, UsersService],
  exports: [LanguageService],
})
export class LanguageModule {}

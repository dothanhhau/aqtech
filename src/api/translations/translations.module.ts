import { Module } from '@nestjs/common';
import { TranslationsService } from './services/translations.service';
import { TranslationsController } from './controllers/translations.controller';
import { DatabaseModule } from '@/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Language } from '@/database/entity/language.entity';
import { UsersService } from '../users/services/users.service';
import { Dictionary } from '@/database/entity/dictionary.entity';
import { DictionaryKeywords } from '@/database/entity/dictionary_keyword.entity';

@Module({
  imports: [
    DatabaseModule.UserSharedOrmModule,
    TypeOrmModule.forFeature([Language, Dictionary, DictionaryKeywords], 'postgres'),
  ],
  controllers: [TranslationsController],
  providers: [TranslationsService, UsersService],
  exports: [TranslationsService],
})
export class TranslationsModule {}

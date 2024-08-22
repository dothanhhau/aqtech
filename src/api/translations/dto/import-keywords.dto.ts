import { IsNotEmpty, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTranslationDto } from './create-translation.dto';

export class ImportTranslationsDto {
  @IsNotEmpty()
  @IsArray()
  @Type(() => CreateTranslationDto)
  data: CreateTranslationDto[];
}

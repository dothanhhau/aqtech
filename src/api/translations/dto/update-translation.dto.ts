import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateTranslationDto {
  @IsNotEmpty()
  @IsString()
  language_id: string;

  @IsNotEmpty()
  @IsString()
  translation: string;
}

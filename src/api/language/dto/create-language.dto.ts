import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLanguageDto {
  @IsNotEmpty()
  @IsString()
  language: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsString()
  country_code: string;

  @IsString()
  country_name: string;

  @IsString()
  flag: string;
}

import { IsNotEmpty } from 'class-validator';

export class UpdateLanguageStatusDto {
  @IsNotEmpty()
  enable?: boolean;
}

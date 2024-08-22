import { IsString } from 'class-validator';

export class UpdateLanguageRequest {
  @IsString()
  language_id: string;
}

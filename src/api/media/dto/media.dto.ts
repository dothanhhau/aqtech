import { IsNumber, IsString } from 'class-validator';

export class CreateMediaDto {
  @IsNumber()
  index: number;

  @IsString()
  url_full: string;
}

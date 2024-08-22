import { IsString, Length, MinLength } from 'class-validator';

export class ChangePasswordRequest {
  @IsString()
  current_password: string;

  @IsString()
  @MinLength(4)
  new_password: string;
}

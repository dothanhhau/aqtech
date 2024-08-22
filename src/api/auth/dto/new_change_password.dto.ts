import { IsEmail, IsString } from 'class-validator';

export class NewChangePassword {
  @IsString()
  @IsEmail()
  username: string;

  @IsString()
  new_password: string;

  @IsString()
  verification_code: string;
}

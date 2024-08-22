import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { TypeSocial } from '../../../common/enum';

export class LoginDto {
  @IsString()
  @IsEmail()
  username: string;

  @IsString()
  password: string;
}


export class LoginSocialDto {
  @IsEmail()
  email: string;
  
  // @IsString()
  // role: string;
  // type?: TypeSocial;
}

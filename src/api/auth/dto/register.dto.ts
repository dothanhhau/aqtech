import { IsString } from 'class-validator';
import { TypeSocial } from '../../../common/enum';

export class RegisterDto {
  @IsString()
  // @IsEmail()
  username: string;

  @IsString()
  password: string;

  @IsString()
  role: string;

  // @IsString()
  type?: string;
}

export class VerifyEmail {
  @IsString()
  email: string;

  @IsString()
  otp: string;
}

export class UpdateUserSocialDto {
  typeUser: string;
  type?: TypeSocial;
  user_id: string;
  social_id: string;
  // email: string;
  // displayName: string;
  // photo: string;
  // accessToken: string;
}

export class CheckSocialDto {
  type?: TypeSocial;

  user_id: string;
}

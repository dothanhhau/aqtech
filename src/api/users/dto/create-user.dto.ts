import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RequestUser {
  @IsEmail()
  username: string;
}

export class CreateNewUser {
  @IsEmail()
  email: string;

  @IsString()
  role: string;
}

export class CreateUserVerification {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  email: string;
}

export class ResendOtp {
  @IsEmail()
  username: string;

  @IsString()
  type: string;
}


export class ResetPassWord {
  @IsEmail()
  username: string;
}

import { IsString } from 'class-validator';

export class RefreshToken {
  user_name: string;

  @IsString()
  refresh_token: string;
}

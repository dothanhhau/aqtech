import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { AuthService } from '../services/auth.service';
import { Strategy } from 'passport-local';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UsersService } from '@/api/users/services/users.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService, private usersService: UsersService) {
    super();
  }

  async validate(username: string, password: string): Promise<any> {
    let user = await this.usersService.findByUserName(username);
    const userVerificationByOtp = await this.usersService.getUserVerificationByOtp(username, password);
    const userVerification = await this.usersService.getUserVerificationByUsername(username);

    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    if (!user.active) {
      throw new HttpException(ErrorCode.user_has_been_suspended, HttpStatus.FORBIDDEN);
    }

    if (user.is_need_change_password) {
      if (!userVerificationByOtp) {
        throw new HttpException(ErrorCode.username_password_incorrect, HttpStatus.BAD_REQUEST);
      }

      const message = {
        statusCode: 400,
        message: ErrorCode.user_need_change_password,
        verification_id: userVerificationByOtp?.otp,
      };
      throw new HttpException(message, HttpStatus.BAD_REQUEST);
    }

    if (!user.is_need_change_password && userVerification && userVerification.delete) {
      throw new HttpException(ErrorCode.user_not_verified, HttpStatus.BAD_REQUEST);
    }

    user = await this.authService.verifyPassword(username, password);
    if (!user) {
      throw new HttpException(ErrorCode.username_password_incorrect, HttpStatus.BAD_REQUEST);
    }

    return user;
  }
}

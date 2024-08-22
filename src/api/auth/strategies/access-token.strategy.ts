import { UsersService } from '@/api/users/services/users.service';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UserPayload } from '@/shared/http/request.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class AccessTokenStrategy extends PassportStrategy(Strategy) {
  constructor(public usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: true,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET,
    });
  }

  async validate(payload: UserPayload) {
    const currentTime = Date.now() / 1000;
    if (payload.exp < currentTime) {
      throw new HttpException(ErrorCode.access_token_expired, HttpStatus.UNAUTHORIZED);
    }

    const user = await this.usersService.findByUserName(payload.username);
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    if (!user.active) {
      throw new HttpException(ErrorCode.user_has_been_suspended, HttpStatus.FORBIDDEN);
    }

    return payload;
  }
}

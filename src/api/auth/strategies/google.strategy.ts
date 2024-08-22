import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import axios from 'axios';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { TypeSocial } from '../../../common/enum';
import { ErrorCode } from '../../../common/exceptions/error-code.exception';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private config: ConfigService,
  ) {
    super({
      clientID: config.get('GOOGLE_CLIENT_KEY'), // key devTam
      clientSecret: config.get('GOOGLE_SECRET_KEY'), // key devTam
      callbackURL: config.get('CALL_BACK_URL_YOUTUBE'),
      passReqToCallback: true,
      scope: ['profile', 'email', 'https://www.googleapis.com/auth/youtube.readonly'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any, done: VerifyCallback): Promise<any> {
    const allowedDomains = this.config.get('ALLOWED_DOMAINS');
    const emailDomain = done.emails[0].value.split('@')[1];
    let errs = "";
    if (!allowedDomains.includes(emailDomain)) {
      errs = ErrorCode.domain_not_allowed
      // throw new HttpException(ErrorCode.domain_not_allowed, HttpStatus.BAD_REQUEST);
    }

    let userSocial = {
      socialId: done._json.sub,
      email: done._json.email,
      displayName: done._json.name,
      photo: done._json.picture,
      accessToken: refreshToken,
      refreshToken: refreshToken,
      username: done._json.sub,
      err: errs
    };

    return userSocial;
    done(null, userSocial);
  }
}

import { UserPayload } from '@/shared/http/request.interface';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export class PreAccessTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-preaccess',
) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET
    })
  }

  async validate(payload: UserPayload) {
    return payload;
  }
}

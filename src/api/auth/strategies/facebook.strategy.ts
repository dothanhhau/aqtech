import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import { ConfigService } from '@nestjs/config';
import { TypeSocial } from '../../../common/enum';
import axios from 'axios';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private config: ConfigService,
  ) {
    super({
      clientID: '982623536671259',
      clientSecret: 'c730e706ea75255c5d164ec340b1c1e3', 
      callbackURL: config.get('CALL_BACK_URL_FACEBOOK'),
      profileFields: ['id', 'emails', 'name'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const { data } = await axios.get(
      `https://graph.facebook.com/v14.0/${profile.id}?fields=email,name,picture&access_token=${accessToken}`,
    );
    const user = {
      socialId: profile.id,
      email: '', 
      displayName: profile._json.first_name + ' ' + profile._json.last_name,
      photo: data.picture.data.url,
      accessToken: accessToken,
      username: profile.id
    };
    return user;
  }
}

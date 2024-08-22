import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config'; 
import { Strategy } from 'passport-instagram';

@Injectable()
export class InstagramStrategy extends PassportStrategy(Strategy, 'instagram') {
  constructor(private config: ConfigService) {
    super({
      clientID: '748849903980939',
      clientSecret: '96c549885aedd9a48e89358c8577330c',
      callbackURL: config.get('CALL_BACK_URL_INSTAGRAM'),
      // passReqToCallback: true,

    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    try {
      console.log("Entered validate method");
      const user = {
        userId: profile.id,
        username: profile.username,
      };
      console.log(user);

      // Check for additional conditions or database queries if needed

      // return done(null, user);
    } catch (error) {
      console.error("Error during Instagram authentication:", error);
      // return done(error, false);
    }
  }
}
import { UsersService } from '@/api/users/services/users.service';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
  Redirect,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags } from '@nestjs/swagger';
import { RequestUser, ResendOtp, ResetPassWord } from '../../users/dto';
import { LoginDto, LoginSocialDto } from '../dto/login.dto';
import { RegisterDto, VerifyEmail, UpdateUserSocialDto, CheckSocialDto } from '../dto/register.dto';
import { NewChangePassword } from '../dto/new_change_password.dto';
import { RefreshToken } from '../dto/refresh-token.dto';
import { AuthService } from '../services/auth.service';
import { UseInterceptors } from '@nestjs/common';
import { SentryInterceptor } from '@/common/interceptors';
import { TypeSocial, TypeUser } from '../../../common/enum';
import { ConfigService } from '@nestjs/config';

@UseInterceptors(SentryInterceptor)
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private config: ConfigService,
  ) {}

  // @Post('register')
  // register(@Body() body: RegisterDto) {
  //   return this.usersService.register(body);
  // }

  @Put('verify-email')
  verifyEmail(@Body() body: VerifyEmail) {
    return this.authService.verifyEmail(body.email, body.otp);
  }

  // @Post('login-social')
  // async loginSocial(@Body() body: LoginSocialDto) {
  //   // Register user
  //   const registerBody: RegisterDto = {
  //     username: body.email,
  //     password: '', 
  //     type: TypeSocial.YOUTUBE,
  //     role: TypeUser.JUNIOR_ACCOUNT_EXECUTIVE,
  //   };
  //   const tokens = await this.authService.socialLogin(registerBody, registerBody.type, registerBody.role);
  //   return tokens;
  // }

  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Body() body: LoginDto) {
    return this.authService.signValidatedUser(body.username);
  }

  @Post('refresh')
  refreshTokens(@Body() refreshTokenDTo: RefreshToken) {
    return this.authService.refreshToken(refreshTokenDTo);
  }

  @Post('resend-otp')
  resendOtp(@Body() dto: ResendOtp) {
    const verificationType = dto.type === 'register' ? 'CREATE' : 'FORGET_PASSWORD';
    const activeStatus = dto.type === 'register' ? false : true;
    return this.usersService.createUserVerification(dto, verificationType, activeStatus);
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.CREATED)
  forgetPassword(@Body() dto: RequestUser) {
    return this.usersService.createUserVerification(dto, 'FORGET_PASSWORD', true);
  }

  @Get('check-user-forget-password/:username')
  checkUserForget(@Param('username') username: string) {
    return this.usersService.checkUserForget(username);
  }

  @Post('new-change-password')
  newChangePassword(@Body() dto: NewChangePassword) {
    return this.authService.changeNewPassword(dto);
  }

  @HttpCode(200)
  @Get('check-time-verification/:username')
  @HttpCode(HttpStatus.CREATED) // type = FORGET_PASSWORD || CREATE || RESET_PASSWORD
  checkTimeVerification(@Param('username') username: string, @Param('type') type: string) {
    return this.usersService.checkTimeVerification(username, false, type);
  }

  // @Post('check-social')
  // checkSocial(@Body() req: CheckSocialDto) {
  //   return this.socialService.checkSocial(req);
  // }

  // @Get('google')
  // @UseGuards(AuthGuard('google'))
  // async googleLogin() {}

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // @Redirect()
  // async googleLoginCallback(@Request() req) {
  //   const userSocial = req.user;
  //   console.log(userSocial);
  //   let redirectUrl;
  //   const mainWebsite = this.config.get('MAIN_WEBSITE')
  //   if (userSocial.err) {
  //     redirectUrl = `${mainWebsite}/oauth/callback?linkingStatus=false&error=${userSocial.err}&type=${TypeSocial.YOUTUBE}&socialId=${userSocial.email}`;
  //     return { url: redirectUrl };
  //   }
    
  //   const errs = await this.socialService.createSocialAccount(userSocial, TypeSocial.YOUTUBE);
  //   if (!errs) {
  //     redirectUrl = `${mainWebsite}/oauth/callback?type=${TypeSocial.YOUTUBE}&socialId=${userSocial.email}`;
  //   }
  //   else {
  //     redirectUrl = `${mainWebsite}/oauth/callback?linkingStatus=false&error=${errs}&type=${TypeSocial.YOUTUBE}&socialId=${userSocial.email}`;
  //   }
  //   return { url: redirectUrl };
  // }

  // @Get('facebook')
  // @UseGuards(AuthGuard('facebook'))
  // async facebookLogin() {}

  // @Get('facebook/callback')
  // @UseGuards(AuthGuard('facebook'))
  // @Redirect()
  // async facebookLoginCallback(@Request() req) {
  //   const userSocial = req.user;
  //   console.log(userSocial);
  //   await this.socialService.createSocialAccount(userSocial, TypeSocial.FACEBOOK);
  //   const redirectUrl = `http://localhost:1234/oauth/callback?type=${TypeSocial.FACEBOOK}&socialId=${userSocial.socialId}`;
  //   return { url: redirectUrl };
  // }

  // @Get('instagram')
  // @UseGuards(AuthGuard('instagram'))
  // async instagramLogin() {}

  // @Get('instagram/callback')
  // @UseGuards(AuthGuard('instagram'))
  // @Redirect()
  // async instagramLoginCallback(@Request() req) {
  //   const userSocial = req.user;
  //   console.log(userSocial);
  // }

  // @Get('tiktok')
  // @Redirect()
  // async tiktokLogin() {
  //   const csrfState = Math.random().toString(36).substring(2);
  //   var url = await this.authService.tiktokLogins(csrfState);
  //   // res.cookie('csrfState', csrfState, { maxAge: 60000 });

  //   return { url };
  // }

  // @Get('tiktok/callback')
  // @Redirect()
  // async tiktokLoginCallback(@Request() req, @Res() res) {
  //   const code = req.query.code;
  //   if (!code) return;

  //   const tiktokInfor = await this.authService.getTikTokInfor(code);
  //   console.log('tiktokInfor: ' + tiktokInfor);
  //   await this.socialService.createSocialAccount(tiktokInfor, TypeSocial.TIKTOK);
  //   const redirectUrl = `http://localhost:1234/oauth/callback?type=${TypeSocial.TIKTOK}&socialId=${tiktokInfor.socialId}`;
  //   return { url: redirectUrl };

  //   // const createSocial = await this.socialService.createSocial(null, tiktokInfor, TypeSocial.TIKTOK);
  //   // console.log("createSocial: " + createSocial)
  //   // if (!createSocial) {
  //   //   const redirectUrl = `http://localhost:1234/oauth/callback?linkingStatus=fasle&error=social_exited&type=${TypeSocial.TIKTOK}&socialId=${tiktokInfor.socialId}`;
  //   //   return { url: redirectUrl };
  //   // }
  //   // const redirectUrl = `http://localhost:1234/oauth/callback?linkingStatus=success&type=${TypeSocial.TIKTOK}&socialId=${tiktokInfor.socialId}`;
  //   // return { url: redirectUrl };

  //   // const tiktokInfor = await this.authService.getTikTokInfor(code);
  //   // const tokens = await this.authService.socialLogin(tiktokInfor, TypeSocial.TIKTOK, TypeUser.KOL);
  //   // const redirectUrl = `http://localhost:1234/oauth/callback?status=success&access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`;

  //   // return { url: redirectUrl };
  // }

  // @Put('update-user-social')
  // updateUserSocial(@Request() req, @Body() body: UpdateUserSocialDto) {
  //   // return this.socialService.updateUserSocial(req.user, body);
  // }

  // //////////////////////////////////////////////////////
  // //////////////////////////////////////////////////////////////////////////////

  // @Get(':shortUrl')
  // @Redirect('', 302)
  // async redirectToOriginalUrl(@Param('shortUrl') shortUrl: string) {
  //   const originalUrl = await this.socialService.getOriginalUrl(shortUrl);
  //   if (!originalUrl) {
  //     return { url: '/' }; // Redirect to homepage if short URL doesn't exist
  //   }
  //   return { url: originalUrl };
  // }
}

// @Get('google/callback')
// @UseGuards(AuthGuard('google'))
// @Redirect()
// async googleLoginCallback(@Request() req) {
//   const userSocial = req.user;
//   console.log(userSocial);
//   const tokens = await this.authService.socialLogin(userSocial, TypeSocial.YOUTUBE, TypeUser.KOL);
//   var userExited = await this.usersService.findByUserName(userSocial.socialId);
//   if (userExited) {
//     this.socialService.createSocial(userExited.id, userSocial, TypeSocial.YOUTUBE);
//   }
//   const redirectUrl = `http://localhost:1234/oauth/callback?status=success&access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`;

//   return { url: redirectUrl };
// }

// @Get('google/callback')
// @UseGuards(AuthGuard('google'))
// @Redirect()
// async googleLoginCallback(@Request() req, @Res() res) {
//   const userSocial = req.user;
//   console.log(userSocial);
//   const tokens = await this.authService.socialLogin(userSocial, TypeSocial.YOUTUBE, TypeUser.KOL);

//   return tokens;
//   // Register user
//   const registerBody: RegisterDto = {
//     username: userSocial.socialId,
//     password: '',
//     type: TypeSocial.YOUTUBE,
//     role: TypeUser.KOL,
//   };
//   var userExited = await this.usersService.findByUserName(userSocial.socialId);
//   if (!userExited) {
//     await this.usersService.register(registerBody);
//   }

//   var createSocial = this.socialService.createSocial(userSocial, TypeSocial.YOUTUBE);
//   if (createSocial) {
//     const redirectUrl = `http://localhost:1234/account/network?linkingStatus=success&type=${TypeSocial.YOUTUBE}&socialId=${userSocial.socialId}`;
//     return { url: redirectUrl };
//   } else {
//     const redirectUrl = `http://localhost:1234/account/network?linkingStatus=account_link_exited&type=${
//       TypeSocial.YOUTUBE
//     }&socialId=${''}`;
//     return { url: redirectUrl };
//   }
// }

// @Get('facebook/callback')
// @UseGuards(AuthGuard('facebook'))
// @Redirect()
// async facebookLoginCallback(@Request() req) {
//   const userSocial = req.user;
//   console.log(userSocial);
//   const tokens = await this.authService.socialLogin(userSocial, TypeSocial.FACEBOOK, TypeUser.KOL);
//   var userExited = await this.usersService.findByUserName(userSocial.socialId);
//   if (userExited) {
//     this.socialService.createSocial(userExited.id, userSocial, TypeSocial.FACEBOOK);
//   }

//   const redirectUrl = `http://localhost:1234/oauth/callback?status=success&access_token=${tokens.access_token}&refresh_token=${tokens.refresh_token}`;
//   return { url: redirectUrl };
// }

// @Get('facebook/callback')
// @UseGuards(AuthGuard('facebook'))
// @Redirect()
// async facebookLoginCallback(@Request() req, @Res() res) {
//   const userSocial = req.user;
//   console.log(userSocial);

//   // Register user
//   const registerBody: RegisterDto = {
//     username: userSocial.socialId,
//     password: '',
//     type: TypeSocial.FACEBOOK,
//     role: TypeUser.KOL,
//   };
//   var userExited = await this.usersService.findByUserName(userSocial.socialId);
//   if (!userExited) {
//     await this.usersService.register(registerBody);
//   }

//   var createSocial = this.socialService.createSocial(userSocial, TypeSocial.FACEBOOK);
//   if (createSocial) {
//     const redirectUrl = `http://localhost:1234/account/network?linkingStatus=success&type=${TypeSocial.FACEBOOK}&socialId=${userSocial.socialId}`;
//     return { url: redirectUrl };
//   } else {
//     const redirectUrl = `http://localhost:1234/account/network?linkingStatus=account_link_exited&type=${
//       TypeSocial.FACEBOOK
//     }&socialId=${''}`;
//     return { url: redirectUrl };
//   }
// }

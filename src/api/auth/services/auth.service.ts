import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UserPayload } from '@/shared/http/request.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../../users/services/users.service';
import { NewChangePassword } from '../dto/new_change_password.dto';
import { RefreshToken } from '../dto/refresh-token.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { UserVerification } from '@/database/entity';
import axios from 'axios';
import { TypeSensMail, TypeSocial, TypeUser } from '@/common/enum';
import { RegisterDto } from '../dto/register.dto';
const jwt = require('jsonwebtoken');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserVerification, 'postgres')
    private readonly userVerificationRepository: Repository<UserVerification>,
    private config: ConfigService,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  /**
   * Validate user credentials
   * @param username
   * @param password
   * @returns
   */
  async verifyPassword(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUserName(username);
    if (user && (await bcrypt.compare(password, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  /**
   * Verify email
   * @param email
   * @returns
   */
  async verifyEmail(email: string, otp: string): Promise<any> {
    const userVerification = await this.userVerificationRepository.findOneBy({ email, otp });
    if (!userVerification) {
      throw new HttpException(ErrorCode.verification_incorrect, HttpStatus.NOT_FOUND);
    }

    userVerification.delete = false;
    await this.userVerificationRepository.save(userVerification);

    const user = await this.usersService.getMe('', email);
    let roles = await this.usersService.getRolebyUsers(user.id);
    const payload: UserPayload = {
      userId: user.id,
      username: email,
      isNeedChangePassword: user.is_need_change_password,
      roleNames: roles,
    };

    return {
      access_token: this.signAccessToken(payload),
      refresh_token: this.signRefreshToken(payload),
    };
  }

  /**
   * Sign in with validated user
   * @param username
   * @returns
   */
  async signValidatedUser(username: string) {
    const user = await this.usersService.getMe('', username);
    let roles = await this.usersService.getRolebyUsers(user.id);

    const payload: UserPayload = {
      userId: user.id,
      username: username,
      isNeedChangePassword: user.is_need_change_password,
      roleNames: roles,
    };

    return {
      access_token: this.signAccessToken(payload),
      refresh_token: this.signRefreshToken(payload),
    };
  }

  /**
   * Refresh token
   * @param refreshTokenDTo
   * @returns
   */
  async refreshToken(refreshTokenDTo: RefreshToken) {
    try {
      const refreshToken = jwt.verify(
        refreshTokenDTo.refresh_token.toString(),
        this.config.get('JWT_REFRESH_TOKEN_SECRET'),
      );
      const { userId, username, roleNames } = refreshToken;
      const user = await this.usersService.getMe('', username);
      if (!user || username != refreshTokenDTo.user_name) {
        throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
      }

      const payloadRefresh: UserPayload = {
        userId: userId,
        username: username,
        roleNames: roleNames,
        isNeedChangePassword: user.is_need_change_password,
      };

      const payloadAccess: UserPayload = {
        userId: user.id,
        username: username,
        roleNames: roleNames,
        isNeedChangePassword: user.is_need_change_password,
      };

      return {
        access_token: this.signAccessToken(payloadAccess),
        refresh_token: this.signRefreshToken(payloadRefresh),
      };
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new HttpException(ErrorCode.refresh_token_expired, HttpStatus.UNAUTHORIZED);
      } else {
        throw new HttpException(ErrorCode.refresh_token_invalid, HttpStatus.BAD_REQUEST);
      }
    }
  }

  /**
   * Generate JWT refresh token
   * @param payload
   * @returns
   */
  signRefreshToken(payload: UserPayload) {
    return this.jwtService.sign(payload, {
      secret: this.config.get('JWT_REFRESH_TOKEN_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_TOKEN_EXPIRATION_TIME'),
    });
  }

  /**
   * Generate JWT access token
   * @param payload
   * @returns
   */
  signAccessToken(payload: UserPayload) {
    return this.jwtService.sign(payload, {
      secret: this.config.get('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_TOKEN_EXPIRATION_TIME'),
    });
  }

  /**
   * Change new password
   * @param dto
   * @returns
   */
  async changeNewPassword(dto: NewChangePassword) {
    const user = await this.usersService.findByUserName(dto.username);
    if (!user) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }
    if (dto.verification_code == dto.new_password) {
      throw new HttpException(ErrorCode.the_new_password_cannot_be_the_same_as_the_otp, HttpStatus.BAD_REQUEST);
    }

    const userVerification = await this.usersService.getUserVerificationByOtp(dto.username, dto.verification_code);
    if (!userVerification || userVerification == null) {
      throw new HttpException(ErrorCode.verification_incorrect, HttpStatus.BAD_REQUEST);
    }
    const currentTime = new Date().getMinutes();
    const timeRequest = new Date(userVerification.time_request).getMinutes();

    if (userVerification.type == 'CREATE' && currentTime - timeRequest > this.config.get('TIMEOUT_CREATE')) {
      throw new HttpException(ErrorCode.verification_expired, HttpStatus.BAD_REQUEST);
    } else if (
      userVerification.type == 'FORGET_PASSWORD' &&
      currentTime - timeRequest > this.config.get('TIMEOUT_FORGET_PASSWORD')
    ) {
      throw new HttpException(ErrorCode.verification_expired, HttpStatus.BAD_REQUEST);
    }
    else if (
      userVerification.type == TypeSensMail.reset_password && currentTime - timeRequest > this.config.get('TIMEOUT_RESET_PASSWORD')
    ) {
      throw new HttpException(ErrorCode.verification_expired, HttpStatus.BAD_REQUEST);
    }

    await this.usersService.updateNewUser(dto);
    return await this.usersService.retrieve(user.id);
  }

  /**
   * Login by tiktok
   * @param csrfState
   * @returns
   */
  async tiktokLogins(csrfState: string): Promise<any> {
    let url = 'https://www.tiktok.com/v2/auth/authorize/';
    url += `?client_key=${this.config.get('TIKTOK_CLIENT_KEY')}`;
    url += '&scope=user.info.basic,user.info.profile,user.info.stats';
    url += '&response_type=code';
    url += `&redirect_uri=${this.config.get('CALL_BACK_URL_TIKTOK')}`;
    url += '&state=' + csrfState;

    return url;
  }

  async getTikTokInfor(code: string) {
    const data = {
      client_key: this.config.get('TIKTOK_CLIENT_KEY'),
      client_secret: this.config.get('TIKTOK_CLIENT_SECRECT'),
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.get('CALL_BACK_URL_TIKTOK'),
    };

    try {
      const response = await axios.post('https://open.tiktokapis.com/v2/oauth/token/', data, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Cache-Control': 'no-cache',
        },
      });

      const { open_id, access_token } = response.data;
      console.log(response.data);
      let existUser = true;
      const user = await this.usersService.findByUserName(open_id);
      if (!user || user == null) {
        existUser = false;
      }

      if (response.data.scope.includes('user.info.basic') && response.data.scope.includes('user.info.stats')) {
        try {
          const userInfoUrl = `https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name,bio_description,follower_count,likes_count,video_count`;
          const userInfoResponse = await axios.get(userInfoUrl, {
            headers: {
              Authorization: `Bearer ${access_token}`,
            },
          });
          const resUserInfor = userInfoResponse.data.data.user;

          const userInfor = {
            socialId: open_id,
            existUser,
            accessToken: access_token,
            photo: resUserInfor.avatar_url,
            displayName: resUserInfor.display_name,
            bioDescription: resUserInfor.bio_description,
            followerCount: resUserInfor.follower_count,
            likesCount: resUserInfor.likes_count,
            videoCount: resUserInfor.video_count,
            email: '',
          };
          console.log(userInfor);

          return userInfor;
        } catch (error) {
          throw new HttpException(ErrorCode.tiktok_information_fail, HttpStatus.BAD_REQUEST);
        }
      } else {
        console.log('Not at scope');
        return {
          socialId: open_id,
          existUser,
          accessToken: access_token,
          photo: '',
          displayName: '',
          followerCount: '',
          likesCount: '',
          videoCount: '',
          email: '',
        };
      }
    } catch (error) {
      throw new HttpException(ErrorCode.tiktok_information_fail, HttpStatus.BAD_REQUEST);
    }
  }

  async socialLogin(userInfor: any, type: string, role: string) {
    const user = await this.usersService.getMe('', userInfor.username);
    if (!user.active) {
      throw new HttpException(ErrorCode.user_has_been_suspended, HttpStatus.FORBIDDEN);
    }

    let roles = await this.usersService.getRolebyUsers(user.id);

    const payload: UserPayload = {
      userId: user.id,
      username: userInfor.username,
      isNeedChangePassword: user.is_need_change_password,
      roleNames: roles,
    };

    return {
      access_token: this.signAccessToken(payload),
      refresh_token: this.signRefreshToken(payload),
    };

    ///////////////////////////////

    // var userEntity = await this.usersService.findByUserName(userInfor.username);
    // if (userEntity) {
    //   throw new HttpException(ErrorCode.user_already_exist, HttpStatus.BAD_REQUEST);
    // } else {
    //   var socialEntity = await this.socialRepository.findOneBy({
    //     social_id: userInfor.username,
    //     delete: false,
    //     user_id: Not(IsNull()),
    //   });

    //   if (socialEntity) {
    //     throw new HttpException(ErrorCode.social_exited, HttpStatus.BAD_REQUEST);
    //   }
    // }
    // let user = await this.usersService.findByUserName(userInfor.username);
    // if (!user) {
    //   const registerBody: RegisterDto = {
    //     username: userInfor.username,
    //     password: '',
    //     type,
    //     role,
    //   };
    //   user = await this.usersService.register(registerBody);
    // }

    // const payload: UserPayload = {
    //   userId: user.id,
    //   username: user.username,
    //   isNeedChangePassword: user.is_need_change_password,
    //   roleNames: [role],
    // };
    // // await this.socialService.createSocial(tiktokInfor, TypeSocial.TIKTOK);

    // return {
    //   access_token: this.signAccessToken(payload),
    //   refresh_token: this.signRefreshToken(payload),
    // };
  }
}

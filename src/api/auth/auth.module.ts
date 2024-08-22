import { DatabaseModule } from '@/database/database.module';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from '../users/services/users.service';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AccessTokenStrategy } from './strategies/access-token.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { PreAccessTokenStrategy } from './strategies/preaccess-token.strategy';
import { RefreshTokenStrategy } from './strategies/refresh-token.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { InstagramStrategy } from './strategies/instagram.strategy';

@Module({
  imports: [
    DatabaseModule.UserSharedOrmModule,
    PassportModule,
    PassportModule.register({ defaultStrategy: 'google' }),
    PassportModule.register({ defaultStrategy: 'tiktok' }),
    PassportModule.register({ defaultStrategy: 'facebook' }),
    PassportModule.register({ defaultStrategy: 'instagram' }),
    JwtModule.register({}),
    TypeOrmModule.forFeature([], 'postgres'),
  ],
  providers: [
    AuthService,
    UsersService,
    LocalStrategy,
    GoogleStrategy,
    FacebookStrategy,
    InstagramStrategy,
    AccessTokenStrategy,
    RefreshTokenStrategy,
    PreAccessTokenStrategy,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}

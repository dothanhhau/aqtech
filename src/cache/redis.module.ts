import { HttpException, HttpStatus, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ErrorCode } from '@/common/exceptions/error-code.exception';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `.env.${process.env.NODE_ENV}`,
      isGlobal: true,
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async (config: ConfigService) => {
        try {
          const store = await redisStore({
            ttl: config.get('CACHING_EXP', 0),
            socket: {
              host: config.get('REDIS_HOST', 'localhost'),
              port: config.get('REDIS_PORT', 6379),
            },
          });
          return { store };
        } catch (error) {
          throw new HttpException(ErrorCode.connect_to_redis_fail, HttpStatus.INTERNAL_SERVER_ERROR);
        }
      },
      inject: [ConfigService],
    }),
  ],
})
export class RedisCacheModule {}

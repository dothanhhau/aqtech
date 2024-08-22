import { classes } from '@automapper/classes';
import { AutomapperModule } from '@automapper/nestjs';
import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import dotenv from 'dotenv';
import { utilities as nestWinstonUtilities, WinstonModule } from 'nest-winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import winston from 'winston';
import { AuthModule } from './api/auth/auth.module';
import { LanguageModule } from './api/language/language.module';
import { MediaModule } from './api/media/media.module';
import { RoleModule } from './api/role/role.module';
import { UsersModule } from './api/users/users.module';
import { DatabaseModule } from './database/database.module';
import { LoggerMiddleware } from './middleware/middleware';
import { LoggerMiddlewareModule } from './middleware/middleware.module';
import { SharedModule } from './shared/shared.module';
import { PermissionModule } from './api/permission/permission.module';
import { RolePermissionModule } from './api/role_permission/role_permission.module';
import { TranslationsModule } from './api/translations/translations.module';
import { RedisCacheModule } from './cache/redis.module';
import { SettingModule } from './api/setting/setting.module';
import { TuitionModule } from './api/tuition/tuition.module';
import { PaymentModule } from './api/payment/payment.module';
import { ReceiptModule } from './api/receipt/receipt.module';
import { CoreModule } from './shared/logger/logger.module';
import { StudentModule } from './api/student/student.module';

dotenv.config();

function wmTransports(): winston.transport[] {
  const transports: any[] = [];
  transports.push(
    new DailyRotateFile({
      filename: `logs/aqtech-${process.env.NODE_ENV}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '5d',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        nestWinstonUtilities.format.nestLike('AQTech', { prettyPrint: false, colors: true }),
      ),
    }),
  );

  // transports.push(
  //   new winston.transports.Console({
  //     format: winston.format.combine(
  //       winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  //       nestWinstonUtilities.format.nestLike('AQTech', { prettyPrint: true, colors: true }),
  //     ),
  //   }),
  // );
  return transports;
}

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AutomapperModule.forRoot({
      strategyInitializer: classes(),
    }),
    WinstonModule.forRoot({
      transports: wmTransports(),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV}`,
    }),
    AuthModule,
    DatabaseModule,
    LanguageModule,
    TranslationsModule,
    LoggerMiddlewareModule,
    MediaModule,
    PermissionModule,
    RoleModule,
    RolePermissionModule,
    SharedModule,
    UsersModule,
    RedisCacheModule,
    SettingModule,
    TuitionModule,
    PaymentModule,
    ReceiptModule,
    CoreModule,
    StudentModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}

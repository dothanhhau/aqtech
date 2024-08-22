import path from 'path';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import multiPart from '@fastify/multipart';
import * as Sentry from '@sentry/node';
import { AppModule } from './app.module';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { FastifyInstance } from 'fastify';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { NestFactory } from '@nestjs/core';
import { UsersService } from './api/users/services/users.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

require('dotenv').config();
dotenv.config({ path: path.resolve(__dirname, `../.env.${process.env.NODE_ENV}`) });

// const logger = new Logger('INFLUENCER');

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ maxParamLength: 1000 })); //,  { logger: true} { bufferLogs: true }
  //const app = await NestFactory.create(AppModule);

  Sentry.init({
    environment: process.env.SENTRY_ENV,
    dsn: process.env.SENTRY_DNS,
  });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: error.constraints[Object.keys(error.constraints)[0]],
        }));
        return new BadRequestException(result);
      },
      stopAtFirstError: true,
    }),
  );
  //app.register(contentParser);
  app.register(multiPart);

  const CORS_OPTIONS = {
    origin: process.env.CORS_ORIGIN || '*',
    allowedHeaders: [
      'Access-Control-Allow-Origin',
      'Origin',
      'X-Requested-With',
      'Accept',
      'Content-Type',
      'Authorization',
    ],
    exposedHeaders: ['Authorization'],
    // Cache the result of the preflight request for 24 hours
    maxAge: process.env.PREFLIGHT_EXP,
    // Pass the CORS preflight response to the next handler
    preflightContinue: true,
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS', 'PUT', 'DELETE', 'PATCH'],
  };
  app.enableCors(CORS_OPTIONS);
  app.use(cookieParser());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AQTECH')
    .setDescription('AQTECH API')
    .setVersion('2.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' }, 'JWT-auth')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // app.useLogger(app.get(MyLogger));
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const fastifyInstance: FastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.decorateReply('setHeader', function (name: string, value: unknown) {
    this.header(name, value);
  });

  fastifyInstance.decorateReply('end', function () {
    this.send('');
  });

  const usersService = app.get(UsersService);
  await usersService.createSeedData();

  await app.listen(process.env.PORT, '0.0.0.0');
  const appUrl = await app.getUrl();
  console.log(`API is listening on ${appUrl}`);
  console.log(`API documents is serving on: ${appUrl}/docs`);
}

bootstrap();

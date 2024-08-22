import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    // const {
    //   method,
    //   originalUrl,
    //   params,
    //   body,
    //   query,
    //   ip,
    //   headers: { authorization, 'user-agent': userAgent },
    // } = req;
    // const start = Date.now();

    res.on('finish', () => {
      // const { statusCode } = res;
      // const end = Date.now();
      // const responseTime = end - start;
      // this.logger.log(
      //   `*** ${new Date().toISOString()} ::: [${ip}][${originalUrl}][${method}][${statusCode}][${responseTime}ms]: ${JSON.stringify(
      //     {
      //       params,
      //       body,
      //       query,
      //       authorization,
      //       userAgent,
      //     },
      //   )}`,
      // );
    });

    next();
  }
}

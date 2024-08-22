import { Logger } from '@nestjs/common';
import { Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class MyLogger extends Logger {
  error(message: any, trace?: string, context?: string) {
    super.error(message, trace, context);
  }
}

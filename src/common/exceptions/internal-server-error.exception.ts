import { BadRequestException } from '@nestjs/common';

export class InternalServerErrorException extends BadRequestException {
  constructor(entityName: string, ref: string) {
    super(`${entityName} Internal server error (${ref})`);
  }
}

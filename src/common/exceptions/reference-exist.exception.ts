import { BadRequestException } from '@nestjs/common';

export class ReferenceExistException extends BadRequestException {
  constructor(entityName: string, ref: string) {
    super(`${entityName} reference already exists! (${ref})`);
  }
}

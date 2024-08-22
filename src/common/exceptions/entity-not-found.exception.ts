import { BadRequestException } from '@nestjs/common';

export class EntityNotFoundException extends BadRequestException {
  constructor(entityName: string, message = `${entityName} not found!`) {
    super(message);
  }
}

import { ApiProperty } from '@nestjs/swagger';

export class StudentIdDto {
  @ApiProperty()
  id: string;
}

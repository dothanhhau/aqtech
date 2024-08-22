import { ApiProperty } from "@nestjs/swagger";

export class ReadFileDto {
  @ApiProperty({ type: 'file', format: 'binary' })
  file: any;
}

import { ApiProperty } from "@nestjs/swagger";

export class UploadVideoDto {
  @ApiProperty({ type: 'file', format: 'binary' })
  file: any;
}
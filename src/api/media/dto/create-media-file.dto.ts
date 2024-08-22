import { ApiProperty } from '@nestjs/swagger';

export class CreateMediaFileDto {
  @ApiProperty({ type: 'file', format: 'binary' })
  file: any;
}

export class RequestMedias {
  url?: string;
  file_name?: string;
  delete_flag?: boolean = false;
}
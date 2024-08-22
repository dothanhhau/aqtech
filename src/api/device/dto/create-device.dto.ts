import { TypeDevice } from '@/common/enum';
import { IsString } from 'class-validator';

export class CreateDeviceDto {
  @IsString()
  push_key: string;

  @IsString()
  device_type?: TypeDevice;
}

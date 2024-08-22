import { Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { CreateBillResponseDto } from './create-bill-response.dto';

export class EduCreateBillResponseDto {
  @IsString()
  url: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EduBillResponseDto)
  bills: EduBillResponseDto[];

  transferToResponse(): CreateBillResponseDto {
    const billResponse = new CreateBillResponseDto();

    return billResponse;
  }
}

export class EduBillResponseDto {
  @IsString()
  ma_sv: string;

  @IsString()
  so_phieu_bao: string;

  @IsNumber()
  trang_thai: number;
}

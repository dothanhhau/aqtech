import { IsString, IsNotEmpty } from 'class-validator';

export class CreateBillRequestDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsString()
  @IsNotEmpty()
  receiptId: string;

  @IsString()
  @IsNotEmpty()
  redirectURL: string;
}

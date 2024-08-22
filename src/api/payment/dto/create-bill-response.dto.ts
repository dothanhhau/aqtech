import { IsString, IsArray, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class CreateBillResponseDto {
  @IsString()
  @IsNotEmpty()
  url: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  bills: string[];
}

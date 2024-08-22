import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateOfficeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  avatar?: string;
}

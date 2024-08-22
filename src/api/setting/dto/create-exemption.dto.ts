import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateExemptionSettingDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  office_id: string;

  regime_id: string;
  percent: number;

  @IsNumber()
  @IsNotEmpty()
  money: number;
}

export class CreateRevenueDto {
  @IsString()
  @IsNotEmpty()
  type_revenue: string;

  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  office_id: string;
}

export class CreateRegimeDto {
  @IsString()
  @IsNotEmpty()
  revenue_id: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @IsNotEmpty()
  money: number;
}

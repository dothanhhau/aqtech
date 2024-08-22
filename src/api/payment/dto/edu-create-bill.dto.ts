import { IsString, IsBoolean, IsNumber, IsArray, ValidateNested, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export class EduCreateBillDto {
  @IsString()
  ma_sv: string;

  @IsString()
  ten_sv: string;

  @IsBoolean()
  is_nhap_tien: boolean;

  @IsNumber()
  tien_toi_thieu: number;

  @IsString()
  redirect_success: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EduPhieuThuDto)
  phieu_thu: EduPhieuThuDto[];
}

export class EduPhieuThuDto {
  @IsNumber()
  stt: number;

  @IsString()
  hoc_ky: string;

  @IsString()
  so_phieu_bao: string;

  @IsString()
  id_phieu_bao: string;

  @IsString()
  hoc_ky_chu: string;

  @IsString()
  noi_dung: string;

  @IsString()
  chi_tiet: string;

  @IsNumber()
  trang_thai: number;

  @IsString()
  ma_loai_thu: string;

  @IsNumber()
  phai_thu: number;

  @IsNumber()
  tong_thu: number;

  @IsNumber()
  mien_giam: number;

  @IsDateString()
  ngay_thu: string;

  @IsDateString()
  ngay_tao: string;

  @IsDateString()
  date_line: string | null;

  @IsString()
  kenh_thu: string;

  @IsBoolean()
  is_bat_buoc_thanh_toan_het: boolean;
}

export class EduReceiptDto {
  tong_da_thu: number;
  ngay_thu: string;
  trans_id: string;
  ma_sv: string;
  phieu_thu: EduReceiptDetailDto[];
}

export class EduReceiptDetailDto {
  so_phieu_bao: string;
  id_phieu_bao: string;
  id_nhom_ct: string;
}

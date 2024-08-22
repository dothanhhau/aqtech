import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EduBillTransaction } from './edubill_transaction.entity';
import { Receipt } from './receipt.entity';
import { PAYMENT_METHOD } from '@/common/enum/receipt.enum';

@Entity({ name: 'edubill_bill' })
export class EduBillBill extends BaseEntity {
  @Column()
  stt: number;

  @Column()
  hoc_ky: string;

  @Column()
  so_phieu_bao: string;

  @Column()
  id_phieu_bao: string;

  @Column()
  hoc_ky_chu: string;

  @Column({ nullable: true })
  noi_dung: string;

  @Column()
  chi_tiet: string;

  @Column()
  trang_thai: number;

  @Column()
  ma_loai_thu: string;

  @Column()
  phai_thu: number;

  @Column()
  tong_thu: number;

  @Column()
  mien_giam: number;

  @Column({ nullable: true })
  ngay_thu: Date;

  @Column({ nullable: true })
  ngay_tao: Date;

  @Column({ nullable: true })
  date_line: Date;

  @Column()
  kenh_thu: PAYMENT_METHOD;

  @Column()
  is_bat_buoc_thanh_toan_het: boolean;

  @ManyToOne(() => EduBillTransaction, (eduBillTransaction) => eduBillTransaction.phieu_thu)
  @JoinColumn({ name: 'edubill_transaction_id' })
  transaction: EduBillTransaction;

  @OneToOne(() => Receipt, (receipt) => receipt.edu_bill)
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;
}

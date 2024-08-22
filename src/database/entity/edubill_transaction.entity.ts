import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { EduBillBill } from './edubill_bill.entity';

@Entity({ name: 'edubill_transaction' })
export class EduBillTransaction extends BaseEntity {
  @Column()
  ma_sv: string;

  @Column()
  ten_sv: string;

  @Column()
  is_nhap_tien: boolean;

  @Column()
  tien_toi_thieu: number;

  @Column()
  redirect_success: string;

  @Column({ nullable: true })
  payment_url: string;

  @Column({ nullable: true })
  trans_id: string;

  @Column({ nullable: true })
  ngay_thu: string;

  @Column({ nullable: true })
  tong_da_thu: number;

  @OneToMany(() => EduBillBill, (bill) => bill.transaction)
  phieu_thu: EduBillBill[];
}

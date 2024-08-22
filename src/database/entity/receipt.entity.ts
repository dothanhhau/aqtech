import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { TuitionStatus } from '@/common/enum/tuition_status.enum';
import { TuitionExemption } from './tuition_exemption.entity';
import { TuitionRevenue } from './tuition_revenue.entity';
import { EduBillBill } from './edubill_bill.entity';
import { PAYMENT_METHOD } from '@/common/enum/receipt.enum';

@Entity({ name: 'receipt' })
export class Receipt extends BaseEntity {
  @Column()
  receipt_number: number;

  @Column()
  title: string;

  @Column()
  student_id: string;

  @Column()
  student_code: string;

  @Column()
  student_name: string;

  @Column({ nullable: true })
  year: string;

  @Column({ nullable: true })
  semester: string;

  @Column({ nullable: true })
  note: string;

  @Column({ name: 'edit_available', default: false })
  edit_available: boolean;

  @Column({ nullable: true })
  start_date: Date;

  @Column({ nullable: true })
  end_date: Date;

  @Column({ type: 'double precision', default: 0 })
  total: number;

  @Column({ type: 'double precision', default: 0 })
  exemption: number;

  @Column({ type: 'double precision', nullable: true })
  paid: number;

  @Column({ type: 'double precision', default: 0 })
  balance: number;

  @Column({ nullable: true })
  payment_method: PAYMENT_METHOD; // create offline

  @Column({ nullable: true })
  status: TuitionStatus; // create paid

  @Column({ nullable: true })
  pay_by: string; // user pay

  @Column({ nullable: true })
  trans_id: string;

  @Column({ nullable: true })
  collection_date: Date;

  @OneToMany(() => TuitionExemption, (tuitionExemption) => tuitionExemption.receipt)
  tuitionExemptions: TuitionExemption[];

  @OneToMany(() => TuitionRevenue, (tuitionRevenue) => tuitionRevenue.receipt)
  tuitionRevenues: TuitionRevenue[];

  @OneToOne(() => EduBillBill, (bill) => bill.receipt)
  edu_bill: EduBillBill;
}

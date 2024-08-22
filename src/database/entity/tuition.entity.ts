import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Student, TuitionExemption } from '.';
import { BaseEntity } from './base.entity';
import { TuitionRevenue } from './tuition_revenue.entity';

@Entity({ name: 'tuition' })
export class Tuition extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  year: string;

  @Column({ type: 'varchar', nullable: true })
  semester: string;

  @Column({ name: 'start_date', nullable: true })
  start_date?: Date;

  @Column({ name: 'end_date', nullable: true })
  end_date?: Date;

  @Column({ type: 'double precision', default: 0 })
  opening_balance: number; // số dư đầu kỳ

  @Column({ type: 'double precision', default: 0 })
  balance: number; // Số dư nợ

  @Column({ type: 'double precision', default: 0 })
  total_payable: number; // tổng phải nộp

  @Column({ type: 'double precision', default: 0 })
  amount_paid: number; // số tiền đã đóng

  @Column({ type: 'double precision', default: 0 })
  remaining_payable: number; // còn phải nộp

  @Column({ type: 'double precision', default: 0 })
  total_revenue_exemption: number; // tổng khoản thu + miễn giảm

  @Column({ type: 'varchar', nullable: true })
  status: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'varchar', nullable: true })
  student_id: string;

  @ManyToOne(() => Student, (d) => d.tuitions)
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @OneToMany(() => TuitionRevenue, (b) => b.tuition)
  tuitionRevenues: TuitionRevenue[];

  @OneToMany(() => TuitionExemption, (b) => b.tuition)
  tuitionExemptions: TuitionExemption[];
}

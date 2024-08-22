import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Receipt, Revenue, Tuition } from '.';

@Entity('tuition_revenue')
export class TuitionRevenue extends BaseEntity {
  @Column({ type: 'varchar', length: 32, nullable: true })
  tuition_id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  revenue_id: string;

  @Column({ type: 'varchar', nullable: true })
  content: string;

  @Column({ type: 'double precision', nullable: true })
  money: number;

  @Column({ name: 'start_date', nullable: true })
  start_date?: Date;

  @Column({ name: 'end_date', nullable: true })
  end_date?: Date;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @ManyToOne(() => Tuition, (s) => s.tuitionRevenues)
  @JoinColumn({ name: 'tuition_id' })
  tuition: Tuition;

  @ManyToOne(() => Revenue, (b) => b.tuitionRevenues)
  @JoinColumn({ name: 'revenue_id' })
  revenue: Revenue;

  @ManyToOne(() => Receipt, (r) => r.tuitionExemptions, { nullable: true })
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;
}

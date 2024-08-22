import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Exemption, Receipt, Tuition } from '.';

@Entity('tuition_exemption')
export class TuitionExemption extends BaseEntity {
  @Column({ type: 'varchar', length: 32, nullable: true })
  tuition_id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  exemption_id: string;

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

  @ManyToOne(() => Tuition, (s) => s.tuitionExemptions)
  @JoinColumn({ name: 'tuition_id' })
  tuition: Tuition;

  @ManyToOne(() => Exemption, (b) => b.tuitionExemptions)
  @JoinColumn({ name: 'exemption_id' })
  exemption: Exemption;

  @ManyToOne(() => Receipt, (r) => r.tuitionExemptions, { nullable: true })
  @JoinColumn({ name: 'receipt_id' })
  receipt: Receipt;
}

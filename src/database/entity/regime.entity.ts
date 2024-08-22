import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Exemption, Revenue, Student } from '.';
import { BaseEntity } from './base.entity';

@Entity({ name: 'regime' })
export class Regime extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  revenue_id: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'double precision', nullable: true })
  money: number;

  @ManyToOne(() => Revenue, (d) => d.regimes)
  @JoinColumn({ name: 'revenue_id' })
  revenue: Revenue;

  @OneToMany(() => Exemption, (d) => d.regime)
  @JoinColumn({ name: 'exemption_id' })
  exemptions: Exemption[];

  @OneToMany(() => Student, (student) => student.regime)
  students: Student[];
}

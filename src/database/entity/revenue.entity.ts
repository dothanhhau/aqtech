import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Office, Regime } from '.';
import { BaseEntity } from './base.entity';
import { TuitionRevenue } from './tuition_revenue.entity';

@Entity({ name: 'revenue' })
export class Revenue extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  type_revenue: string;

  @Column({ type: 'varchar', nullable: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  office_id: string;

  @ManyToOne(() => Office, (d) => d.revenues)
  @JoinColumn({ name: 'office_id' })
  office: Office;

  @OneToMany(() => Regime, (s) => s.revenue)
  regimes: Regime[];

  @OneToMany(() => TuitionRevenue, (b) => b.revenue)
  tuitionRevenues: TuitionRevenue[];
}

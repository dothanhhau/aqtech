import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Office, Regime, TuitionExemption } from '.';
import { BaseEntity } from './base.entity';

@Entity({ name: 'exemption' })
export class Exemption extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @ManyToOne(() => Regime, (regime) => regime.exemptions)
  @JoinColumn({ name: 'regime_id' })
  regime: Regime;

  @Column({ nullable: true })
  percent: number;

  @Column({ type: 'double precision', nullable: true })
  money: number;

  @OneToMany(() => TuitionExemption, (b) => b.exemption)
  tuitionExemptions: TuitionExemption[];

  @ManyToOne(() => Office, (office) => office.exemptions)
  @JoinColumn({ name: 'office_id' })
  office: Office;
}

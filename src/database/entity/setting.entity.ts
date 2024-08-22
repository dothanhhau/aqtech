import { Column, Entity } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Pay } from '@/common/enum/tuition_status.enum';

@Entity('setting')
export class Setting extends BaseEntity {
  @Column({ type: 'varchar', enum: Pay, nullable: true })
  pay: Pay;

  @Column({ type: 'date', nullable: true })
  start_date_semester_one: Date;

  @Column({ type: 'date', nullable: true })
  end_date_semester_one: Date;

  @Column({ type: 'date', nullable: true })
  start_date_semester_two: Date;

  @Column({ type: 'date', nullable: true })
  end_date_semester_two: Date;

  @Column({ type: 'date', nullable: true })
  start_date_semester_three: Date;

  @Column({ type: 'date', nullable: true })
  end_date_semester_three: Date;

  @Column({ name: 'edubill_config', type: 'text', nullable: true })
  edubill_config: string;
}

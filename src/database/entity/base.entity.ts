import { Column, CreateDateColumn, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { AutoMap } from '@automapper/classes';

export class BaseEntity {
  @AutoMap()
  @PrimaryColumn({ type: 'varchar', length: 32, unique: true })
  id: string;

  @Column({ type: 'boolean', default: false, select: true })
  delete: boolean;

  @AutoMap()
  @CreateDateColumn({ select: true })
  create_date: Date;

  @AutoMap()
  @Column({ type: 'varchar', nullable: true, select: false })
  create_by: string;

  @AutoMap()
  @UpdateDateColumn({ select: true })
  update_date: Date;

  @AutoMap()
  @Column({ type: 'varchar', nullable: true, select: false })
  update_by: string;
}

import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '.';
import { BaseEntity } from './base.entity';

@Entity('device')
export class Device extends BaseEntity {
  @Column({ type: 'varchar', length: 32 })
  user_id: string;

  @Column({ type: 'text' })
  push_key: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  device_type: string;

  @Column({ type: 'boolean', default: true })
  status: boolean;

  @ManyToOne(() => User, (user) => user.devices)
  @JoinColumn({ name: 'user_id' })
  users?: User;
}

import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';
import {} from './user_role.entity';
import { generatedKey } from '../../common/generatedKey';
import { BaseEntity } from './base.entity';

@Entity({ name: 'user_verification' })
export class UserVerification extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', length: 32, unique: true, default: generatedKey.ref(32) })
  id: string;

  @Column({ type: 'varchar', length: 100 })
  username: string;

  // @Column({ type: 'varchar', length: 1024, nullable: true })
  // verification_id: string;

  @Column({ type: 'varchar', nullable: true })
  otp: string;

  @Column({ type: 'varchar', nullable: true })
  email: string;

  @CreateDateColumn({ name: 'time_request', nullable: true })
  time_request: Date;

  //// SMS
  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'varchar', nullable: true })
  transId: string;

  //Response SMS
  @Column({ type: 'int', nullable: true })
  code: number;

  @Column({ type: 'varchar', nullable: true })
  message: string;

  @Column({ type: 'varchar', nullable: true })
  oper: string;

  @Column({ type: 'int', nullable: true })
  totalSMS: number;
}

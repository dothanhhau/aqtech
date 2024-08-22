import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Role, User } from '.';

@Entity('user_role')
export class UserRole extends BaseEntity {
  @Column({ type: 'varchar', length: 32, nullable: true })
  user_id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  role_id: string;

  @ManyToOne(() => Role, (role) => role.userRoles)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @ManyToOne(() => User, (user) => user.userRoles)
  @JoinColumn({ name: 'user_id' })
  user: User;
}

import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Permission, Role } from '.';

@Entity('role_permission')
@Unique(['role', 'permission'])
export class RolePermission extends BaseEntity {
  @Column({ type: 'varchar', width: 10 })
  role_id: string;

  @Column({ type: 'varchar', width: 10 })
  permission_id: string;

  @ManyToOne(() => Role, (role) => role.rolePermission)
  @JoinColumn({ name: 'role_id' })
  role?: Role;

  @ManyToOne(() => Permission, (permission) => permission.rolePermissions)
  @JoinColumn({ name: 'permission_id' })
  permission?: Permission;
}

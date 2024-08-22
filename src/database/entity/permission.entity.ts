import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { RolePermission } from '.';

@Entity('permission')
export class Permission extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  action: string;

  @Column({ type: 'varchar', nullable: true })
  api_endpoint: string;

  @Column({ type: 'varchar', nullable: true })
  api_method: string;

  @Column({ type: 'varchar', nullable: true })
  group_permission: string;

  @Column({ type: 'varchar', nullable: true })
  api_type: string;

  @Column({ type: 'boolean', default: true })
  show_status: boolean;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.permission)
  rolePermissions: RolePermission[];
}

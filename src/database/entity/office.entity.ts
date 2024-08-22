import { Column, Entity, OneToMany } from 'typeorm';
import { Exemption, Revenue, Student, User } from '.';
import { BaseEntity } from './base.entity';

@Entity({ name: 'office' })
export class Office extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  avatar: string;

  @Column({ type: 'varchar', nullable: true })
  full_avatar: string;

  @OneToMany(() => Student, (s) => s.office)
  students: Student[];

  @OneToMany(() => Revenue, (s) => s.office)
  revenues: Revenue[];

  @OneToMany(() => Exemption, (s) => s.office)
  exemptions: Exemption[];

  @OneToMany(() => User, (user) => user.office)
  users: User[];
}

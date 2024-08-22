import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm';
import { Device, Office, StudentUser, UserRole,  } from '.';
import { BaseEntity } from './base.entity';
import { UserLanguage } from './user_language.entity';

@Entity({ name: 'users' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', nullable: true })
  password: string;

  @CreateDateColumn({ name: 'last_login_date' })
  last_login_date: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  fullname: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  birth_place: string;

  @Column({ name: 'birthday', nullable: true })
  birthday?: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  email: string;

  @Column({ type: 'varchar', length: 13, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  full_avatar: string;

  @Column({ type: 'varchar', length: 45, nullable: true })
  type: string;

  @Column({ type: 'boolean', nullable: true, default: true })
  is_need_change_password: boolean;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  job: string;

  @Column({ type: 'boolean', default: false })
  active: boolean;

  @Column({ type: 'date', nullable: true })
  active_date: Date;

  @Column({ type: 'varchar', nullable: true })
  marriage: string;

  @Column({ type: 'varchar', nullable: true })
  area: string;

  // @Column({ type: 'varchar', length: 32, nullable: true })
  // department_id: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  office_id: string;

  // @Column({ type: 'varchar', length: 1024, nullable: true })
  // office_name: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  officer_number: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  department_name: string;

  @Column({ type: 'varchar', nullable: true })
  code: string;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  userRoles: UserRole[];
  roles?: string[];

  @OneToMany(() => Device, (device) => device.users)
  devices: Device[];

  @OneToMany(() => UserLanguage, (userLanguage) => userLanguage.user)
  userLanguages: UserLanguage[];
  language?: string;

  @OneToMany(() => StudentUser, (studentUser) => studentUser.user)
  studentsUsers: StudentUser[];
  
  @ManyToOne(() => Office, (office) => office.users)
  @JoinColumn({ name: 'office_id'})
  office: Office;
  office_name: string;
}

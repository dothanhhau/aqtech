import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Office, Regime, StudentUser, Tuition } from '.';
import { BaseEntity } from './base.entity';

@Entity({ name: 'student' })
export class Student extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  code: string;

  @Column({ type: 'varchar', nullable: true })
  full_name: string;

  @Column({ type: 'varchar', nullable: true })
  class_school: string;

  @Column({ type: 'varchar', nullable: true })
  teacher: string;

  @Column({ type: 'varchar', nullable: true })
  grade: string;

  @Column({ type: 'varchar', nullable: true })
  type_revenue: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 13, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ name: 'birthday', nullable: true })
  birthday?: Date;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  avatar: string;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  full_avatar: string;

  // @Column({ type: 'varchar', length: 45, nullable: true })
  // type: string;

  @Column({ type: 'varchar', nullable: true })
  office_id: string;

  @ManyToOne(() => Office, (d) => d.students)
  @JoinColumn({ name: 'office_id' })
  office: Office;

  @OneToMany(() => Tuition, (s) => s.student)
  tuitions: Tuition[];

  @OneToMany(() => StudentUser, (studentUser) => studentUser.student)
  studentsUsers?: StudentUser[];

  @ManyToOne(() => Regime, (regime) => regime.students)
  @JoinColumn({ name: 'regime_id' })
  regime: Regime;
}

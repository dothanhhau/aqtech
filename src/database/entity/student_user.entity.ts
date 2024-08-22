import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from "typeorm";
import { Student } from "./student.entity";
import { User } from "./user.entity";
import { generatedKey } from "../../common/generatedKey";
import { BaseEntity } from "./base.entity";

@Entity({ name: 'student_user' })
export class StudentUser extends BaseEntity {
  @Column({ type: 'varchar', nullable: true })
  student_id: string;

  @Column({ type: 'varchar', nullable: true})
  user_id: string;

  @ManyToOne(() => Student, (student) => student.studentsUsers)
  @JoinColumn({ name: 'student_id' })
  student?: Student;

  @ManyToOne(() => User, (user) => user.studentsUsers)
  @JoinColumn({ name: 'user_id' })
  user?: User;
}

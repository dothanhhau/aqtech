import { Student, User } from '@/database/entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student, 'postgres')
    private readonly studentRepository: Repository<Student>,
    @InjectRepository(User, 'postgres')
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   *
   * @param username
   * @returns Student[]
   */
  async getStudentsOfUserName(username: string): Promise<Student[]> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.studentsUsers', 'students_users')
      .leftJoinAndSelect('students_users.student', 'student')
      .leftJoinAndSelect('student.office', 'office')
      .where('user.username = :username', { username })
      .andWhere('user.delete = :delete', { delete: false })
      .andWhere('student.delete = :delete', { delete: false })
      .getOne();

    return user.studentsUsers.map((user) => user.student);
  }

  /**
   * Retrieves a student from the database based on the given code.
   *
   * @param {string} code - The code of the student to retrieve.
   * @return {Promise<Student>} A promise that resolves to the student object if found, or null if not found.
   */
  async getStudentByCode(code: string): Promise<Student> {
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.office', 'office')
      .where('student.code = :code', { code })
      .andWhere({ delete: false })
      .getOne();
    return student;
  }

  /**
   * Retrieves a student from the database based on the given ID.
   *
   * @param {string} id - The ID of the student to retrieve.
   * @return {Promise<Student>} A promise that resolves to the student object if found, or null if not found.
   */
  async getStudentById(id: string): Promise<Student> {
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.office', 'office')
      .where('student.id = :id', { id })
      .andWhere({ delete: false })
      .getOne();
    return student;
  }
}

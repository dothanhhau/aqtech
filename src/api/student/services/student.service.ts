import { Office, Student } from '@/database/entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateStudentDto, FilterOfficeDto, UpdateStudentDto } from '../dto/crud-students-dto';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { StudentIdDto } from '../dto/studentId-dto';

@Injectable()
export class StudentService {
  constructor(
    @InjectRepository(Student, 'postgres') private readonly studentRepository: Repository<Student>,
    @InjectRepository(Office, 'postgres') private readonly officeRepository: Repository<Office>,
  ) {}
  async lists(query: FilterOfficeDto) {
    //nếu office_id không được cung cấp trong query, thì tất cả học sinh sẽ được liệt kê
    try {
      const whereCondition = {
        delete: false,
        ...(query.office_id && { office_id: query.office_id }),
      };
      const [students, total] = await this.studentRepository.findAndCount({
        where: whereCondition,
        skip: query.skip,
        take: query.limit,
        relations: ['office'],
      });

      return {
        timestamp: new Date(),
        data: students,
        skip: query.skip,
        limit: query.limit,
        total: total,
      };
    } catch (error) {
      console.error('Error in liststudents method:', error);
    }
  }

  async createStudents(studentDto: CreateStudentDto): Promise<Student> {
    try {
      const existedStudent = await this.studentRepository.findOne({ where: { code: studentDto.code, delete: false } });
      if (existedStudent) {
        throw new HttpException(ErrorCode.student_already_exists, HttpStatus.BAD_REQUEST);
      }
      const existOffice = await this.officeRepository.findOne({ where: { id: studentDto.office_id, delete: false } });
      if (!existOffice) {
        throw new HttpException(ErrorCode.office_not_existed, HttpStatus.BAD_REQUEST);
      }
      const newStudent = await this.studentRepository.create({ ...studentDto });
      return await this.studentRepository.save(newStudent);
    } catch (error) {
      console.error('Error in createStudents method:', error);
    }
  }

  async updateStudent(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    try {
      const student = await this.studentRepository.findOne({ where: { id, delete: false } });
      if (!student) {
        throw new HttpException(ErrorCode.student_not_existed, HttpStatus.NOT_FOUND);
      }
      const existOffice = await this.officeRepository.findOne({
        where: { id: updateStudentDto.office_id, delete: false },
      });
      if (!existOffice) {
        throw new HttpException(ErrorCode.office_not_existed, HttpStatus.BAD_REQUEST);
      }
      await this.studentRepository.update(id, updateStudentDto);
      return this.studentRepository.findOne({ where: { id, delete: false } });
    } catch (error) {
      console.error('Error in updateStudent method:', error);
    }
  }

  async deleteStudents(ids: StudentIdDto[], userReq: any): Promise<Student[]> {
    try {
      const studentIds = ids.map((studentIdDto) => studentIdDto.id);
      const students = await this.studentRepository.find({ where: { id: In(studentIds), delete: false } });

      for (const student of students) {
        await this.resetStudent(student, userReq);
      }
      return await this.studentRepository.save(students);
    } catch (error) {
      console.error('Error in updateStudent method:', error);
    }
  }

  resetStudent(resetStudent: Student, userReq: any) {
    resetStudent.code = null;
    resetStudent.delete = true;
    resetStudent.full_name = null;
    resetStudent.class_school = null;
    resetStudent.gender = null;
    resetStudent.teacher = null;
    resetStudent.grade = null;
    resetStudent.address = null;
    resetStudent.birthday = null;
    resetStudent.phone = null;
    resetStudent.avatar = null;
    resetStudent.full_avatar = null;
    resetStudent.update_by = userReq.id;
    resetStudent.office_id = null;
    resetStudent.regime = null;
    resetStudent.update_date = new Date();
  }

  async studentDetail(id: string): Promise<Student> {
    try {
      const student = await this.studentRepository
        .createQueryBuilder('student')
        .leftJoinAndSelect('student.office', 'office', 'office.delete = :del', { del: false })
        .leftJoinAndSelect('student.regime', 'regime', 'regime.delete = :del', { del: false })
        .leftJoinAndSelect('student.tuitions', 'tuition', 'tuition.delete = :del', { del: false })
        .leftJoinAndSelect('student.studentsUsers', 'studentUser', 'studentUser.delete = :del', { del: false })
        .leftJoinAndSelect('studentUser.user', 'user', 'user.delete = :del', { del: false })
        .where('student.id = :id', { id })
        .andWhere('student.delete = :del', { del: false })
        .orderBy('student.create_date', 'DESC')
        .select([
          'student',
          'office',
          'tuition',
          'regime',
          'studentUser.id',
          'user.id',
          'user.fullname',
          'user.gender',
          'user.address',
          'user.birth_place',
          'user.birthday',
          'user.email',
          'user.phone',
          'user.avatar',
          'user.full_avatar',
        ])
        .getOne();

      if (!student) {
        throw new HttpException(ErrorCode.student_not_existed, HttpStatus.NOT_FOUND);
      }
      return student;
    } catch (error) {
      console.error('Error in studentDetail method:', error);
    }
  }
}

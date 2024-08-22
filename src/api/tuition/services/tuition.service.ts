import { generatedKey } from '@/common/generatedKey';
import {
  Tuition,
  User,
  Office,
  Student,
  Revenue,
  TuitionExemption,
  TuitionRevenue,
  StudentUser,
  Exemption,
  Setting,
  Regime,
  Receipt,
} from '@/database/entity';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UserPayload } from '@/shared/http/request.interface';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { TypeUser } from '../../../common/enum';
import {
  addTimestampToFileNames,
  dateFormatDisplay,
  getMagicNumber,
  getMonthFromDateRange,
  getReceiptNumber,
  paginate,
  removeAccents,
  sortByFirstname,
} from '../../../shared/utility';
import {
  CreateExemptionDto,
  CreateTuitionRevenueDto,
  DeleteStudentDto,
  PaymentReminderDto,
  ReadFileDto,
} from '../dto/create-tuition.dto';
import path from 'path';
import fs from 'fs';
import * as reader from 'xlsx';
import { UsersService } from '../../users/services/users.service';
import { CreateNewUser, OrderBy, SortBy } from '../../users/dto';
import { SEMESTER, StatusRevenue, TuitionStatus } from '../../../common/enum/tuition_status.enum';
import { ConfigService } from '@nestjs/config';
import { FilterExemptionDto, FilterRevenueDto, FilterTuitionDto } from '../dto/filter-tuition.dto';
import { SMSClient } from '../../../common/client_services/sms-client';
import * as ExcelJS from 'exceljs';
import { SelectedTuitionsDto } from '../dto/seleted-tuitions-dto';
import { ReceiptService } from '@/api/payment/services/receipt.service';
import { PAYMENT_METHOD } from '@/common/enum/receipt.enum';

@Injectable()
export class TuitionService {
  readonly columnMoney = '_SoTien';
  readonly xlsx = /\.(xlsx)$/;
  readonly allowRex = /\.(xlsx)$/;
  private DEFAULT_FILES_DIR_EXCEL = path.join(__dirname, '../../../file_excel');
  constructor(
    @InjectRepository(Tuition, 'postgres') private readonly tuitionRepository: Repository<Tuition>,
    @InjectRepository(User, 'postgres') private readonly userRepository: Repository<User>,
    @InjectRepository(Office, 'postgres') private readonly officeRepository: Repository<Office>,
    @InjectRepository(Student, 'postgres') private readonly studentRepository: Repository<Student>,
    @InjectRepository(Revenue, 'postgres') private readonly revenueRepository: Repository<Revenue>,
    @InjectRepository(Regime, 'postgres') private readonly regimeRepository: Repository<Regime>,
    @InjectRepository(Exemption, 'postgres') private readonly exemptionRepository: Repository<Exemption>,
    @InjectRepository(TuitionRevenue, 'postgres') private readonly tuitionRevenueRepository: Repository<TuitionRevenue>,
    @InjectRepository(TuitionExemption, 'postgres')
    private readonly tuitionExemptionRepository: Repository<TuitionExemption>,
    @InjectRepository(StudentUser, 'postgres') private readonly studentUserRepository: Repository<StudentUser>,
    @InjectRepository(Setting, 'postgres') private readonly settingRepository: Repository<Setting>,
    @InjectRepository(Receipt, 'postgres') private readonly receiptRepository: Repository<Receipt>,

    private smsClient: SMSClient,
    private config: ConfigService,
    private userService: UsersService,
  ) {}

  async lists(query: FilterTuitionDto) {
    const response = {
      timestamp: new Date(),
      data: [],
      skip: query.skip,
      limit: query.limit,
      number: [].length,
      total: [].length,
    };
    let students = null;
    students = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.tuitions', 'tuition', 'tuition.delete = :del', { del: false })
      // .leftJoinAndSelect('tuition.tuitionRevenues', 'tuition_revenue', ' tuition_revenue.delete = :del', { del: false })
      // .leftJoinAndSelect('tuition.tuitionExemptions', 'tuition_exemption', ' tuition_exemption.delete = :del', { del: false })
      .orderBy('student.update_date', 'DESC')
      .where({ delete: false });
    // .andWhere('tuition.start_date = tuition_revenue.start_date AND tuition.end_date = tuition_revenue.end_date')
    // .andWhere('tuition.start_date = tuition_exemption.start_date AND tuition.end_date = tuition_exemption.end_date')

    if (query.status) {
      students = students.andWhere('tuition.status = :status', { status: query.status });
    }
    let datas = await students.getMany();
    if (!datas || datas.length == 0) {
      return response;
    }

    if (query.student_name) {
      datas = datas.filter((rs) => {
        let matchName = true;
        if (rs.full_name === null) {
          matchName = false;
        } else if (query.student_name) {
          matchName = removeAccents(rs.full_name.toLowerCase()).includes(
            removeAccents(query.student_name.toLowerCase()),
          );
        }

        return matchName;
      });
    }

    const totalDatas = datas.length;
    const paginatedDatas = paginate(datas, query.skip, query.limit).items;
    if (query.sort_by == SortBy.date && query.order_by == OrderBy.asc) {
      paginatedDatas.sort((a, b) => {
        const dateA = a.update_date ? (a.update_date as Date).getTime() : 0;
        const dateB = b.update_date ? (b.update_date as Date).getTime() : 0;
        return dateA - dateB;
      });
    } else if (query.sort_by == SortBy.date && query.order_by == OrderBy.desc) {
      paginatedDatas.sort((a, b) => {
        const dateA = a.update_date ? (a.update_date as Date).getTime() : 0;
        const dateB = b.update_date ? (b.update_date as Date).getTime() : 0;
        return dateB - dateA;
      });
    }

    let results = [];
    try {
      for (let i = 0; i < paginatedDatas.length; i++) {
        const tuition = paginatedDatas[i].tuitions.length > 0 ? paginatedDatas[i].tuitions[0] : null;
        const studentExemption = await this.tuitionExemptionRepository.findBy({
          delete: false,
          tuition_id: tuition?.id,
          start_date: tuition?.start_date,
          end_date: tuition?.end_date,
        });
        const exemption = studentExemption.length === 0 ? 0 : studentExemption.reduce((sum, x) => sum + x.money, 0);
        const studentRevenue = await this.tuitionRevenueRepository.findBy({
          delete: false,
          tuition_id: tuition?.id,
          start_date: tuition?.start_date,
          end_date: tuition?.end_date,
        });
        const revenue = studentRevenue.length === 0 ? 0 : studentRevenue.reduce((sum, x) => sum + x.money, 0);

        results.push({
          id: paginatedDatas[i].id,
          code: paginatedDatas[i].code,
          full_name: paginatedDatas[i].full_name,
          lastname:
            paginatedDatas[i].full_name === null
              ? ''
              : paginatedDatas[i].full_name.substring(0, paginatedDatas[i].full_name.indexOf(' ')),
          firstname:
            paginatedDatas[i].full_name === null
              ? ''
              : paginatedDatas[i].full_name.substring(paginatedDatas[i].full_name.lastIndexOf(' ') + 1),
          update_date: paginatedDatas[i].update_date,
          exemption: exemption,
          total_payable: paginatedDatas[i].tuitions.length > 0 ? paginatedDatas[i].tuitions[0].total_payable || 0 : 0,
          amount_paid: tuition.amount_paid || 0, // số tiền đã đóng
          remaining_payable:
            paginatedDatas[i].tuitions.length > 0 ? paginatedDatas[i].tuitions[0].remaining_payable || 0 : 0,
          status:
            paginatedDatas[i].tuitions.length > 0
              ? paginatedDatas[i].tuitions[0].status || TuitionStatus.UNPAID
              : TuitionStatus.UNPAID,
          description:
            revenue != (paginatedDatas[i].tuitions.length > 0 ? paginatedDatas[i].tuitions[0].total_payable || 0 : 0)
              ? StatusRevenue.DATA_OTHER_THAN_IMPORT_FILE
              : StatusRevenue.DATA_SAME_AS_IMPORT_FILE,
        });
      }
    } catch (error) {
      console.log(error);
    }

    if (query.sort_by == SortBy.name && query.order_by == OrderBy.asc) {
      results = sortByFirstname(results, 'asc');
    } else if (query.sort_by == SortBy.name && query.order_by == OrderBy.desc) {
      results = sortByFirstname(results, 'desc');
    }

    response.data = results;
    response.number = results.length;
    response.total = totalDatas;
    return response;
  }

  async findNotPaidByStudent(studentId: string) {
    const tuition = await this.tuitionRepository
      .createQueryBuilder('tuition')
      .leftJoinAndSelect(
        'tuition.tuitionRevenues',
        'tuition_revenue',
        'tuition_revenue.receipt_id is null and tuition_revenue.delete = :del',
        { del: false },
      )
      .leftJoinAndSelect('tuition_revenue.revenue', 'revenue', 'revenue.delete = :del', {
        del: false,
      })
      .leftJoinAndSelect(
        'tuition.tuitionExemptions',
        'tuition_exemption',
        'tuition_exemption.receipt_id is null and tuition_exemption.delete = :del',
        {
          del: false,
        },
      )
      .leftJoinAndSelect('tuition_exemption.exemption', 'exemption', 'exemption.delete = :del', { del: false })
      .where({ student_id: studentId, delete: false, status: Not('paid') })
      .getOne();

    if (tuition.tuitionExemptions.length > 0 || tuition.tuitionRevenues.length > 0) {
      return tuition;
    } else {
      return null;
    }
  }

  async findStudent(studentId: string) {
    const student = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.tuitions', 'tuition', 'tuition.delete = :del', { del: false })
      // .leftJoinAndSelect('tuition.tuitionRevenues', 'tuition_revenue', ' tuition_revenue.delete = :del', { del: false })
      // .leftJoinAndSelect('tuition_revenue.revenue', 'revenue', ' revenue.delete = :del', { del: false })
      // .leftJoinAndSelect('tuition.tuitionExemptions', 'tuition_exemption', ' tuition_exemption.delete = :del', { del: false })
      // .leftJoinAndSelect('tuition_exemption.exemption', 'exemption', ' exemption.delete = :del', { del: false })
      .where({ id: studentId, delete: false })
      // .andWhere('tuition.start_date = tuition_revenue.start_date AND tuition.end_date = tuition_revenue.end_date')
      // .andWhere('tuition.start_date = tuition_exemption.start_date AND tuition.end_date = tuition_exemption.end_date')
      .getOne();

    if (!student) {
      throw new HttpException(ErrorCode.student_not_existed, HttpStatus.NOT_FOUND);
    }
    const office = await this.officeFindId(student.office_id);
    const tuition = student.tuitions.length > 0 ? student.tuitions[0] : null;

    const studentExemption = await this.tuitionExemptionRepository.findBy({
      delete: false,
      tuition_id: tuition.id,
      start_date: tuition.start_date,
      end_date: tuition.end_date,
    });
    const exemption = studentExemption.length === 0 ? 0 : studentExemption.reduce((sum, x) => sum + x.money, 0);
    const studentRevenue = await this.tuitionRevenueRepository.findBy({
      delete: false,
      tuition_id: tuition.id,
      start_date: tuition.start_date,
      end_date: tuition.end_date,
    });
    const revenue = studentRevenue.length === 0 ? 0 : studentRevenue.reduce((sum, x) => sum + x.money, 0);
    const start_date = tuition.start_date ?? new Date();
    const end_date = tuition.end_date ?? new Date();
    const receipt = await this.receiptRepository.findOneBy({
      delete: false,
      student_id: studentId,
      start_date: start_date,
      end_date: end_date,
    });

    const total = revenue + exemption;

    const response = {
      id: student.id,
      code: student.code,
      full_name: student.full_name,
      office_id: office?.id,
      office_name: office?.name,
      gender: student.gender,
      phone: student.phone,
      address: student.address,
      birthday: student.birthday,
      type_revenue: student.type_revenue,
      teacher: student.teacher,
      class_school: student.class_school,
      tuition_id: tuition?.id,
      status: tuition?.status,
      receipt_code: '',
      total_payable: tuition?.total_payable,
      amount_paid: tuition?.amount_paid, // số tiền đã đóng
      remaining_payable: tuition.remaining_payable,
      opening_balance: tuition.opening_balance,
    };
    return response;
  }

  async removeStudents(deleteDto: DeleteStudentDto) {
    const ids = deleteDto.ids.map((studentIdDto) => studentIdDto.id);
    const students = await this.studentRepository.find({ where: { id: In(ids), delete: false } });
    if (students.length != deleteDto.ids.length) {
      throw new HttpException(ErrorCode.student_not_existed, HttpStatus.NOT_FOUND);
    }
    const tuitions = await this.tuitionRepository.findBy({ delete: false })
    students.forEach(student => {
      const tuition = tuitions.filter(x => (x.status == TuitionStatus.PAID || x.status == TuitionStatus.PARTIALLY_PAID) && x.student_id == student.id)
      if (tuition.length > 0) {
        throw new HttpException(ErrorCode.tuition_cannot_be_deleted, HttpStatus.BAD_REQUEST);
      }
      const timestamp = Date.now();
      student.delete = true;
      student.code = `${timestamp}_${student.code}`;
      student.full_name = `${timestamp}_${student.full_name}`;
    });
    await this.studentRepository.save(students)
  }

  async revenues(query: FilterRevenueDto) {
    let response = {
      timestamp: new Date(),
      data: [],
      skip: query.skip,
      limit: query.limit,
      number: [].length,
      total: [].length,
    };
    const revenues = await this.tuitionRevenueRepository
      .createQueryBuilder('tuition_revenue')
      .leftJoinAndSelect('tuition_revenue.revenue', 'revenue', 'revenue.delete = :del', { del: false })
      .leftJoinAndSelect('tuition_revenue.tuition', 'tuition', ' tuition.delete = :del', { del: false })
      .leftJoinAndSelect('tuition.student', 'student', ' student.delete = :del', { del: false })
      .where({ delete: false })
      .andWhere('student.id =:studentId', { studentId: query.student_id })
      .andWhere('tuition.start_date = tuition_revenue.start_date AND tuition.end_date = tuition_revenue.end_date')
      .orderBy('tuition_revenue.update_date', 'DESC');

    let datas = await revenues.getMany();
    if (!datas || datas.length == 0) {
      return response;
    }

    const totalDatas = datas.length;
    let paginatedDatas = (await paginate(datas, query.skip, query.limit)).items;
    let results = [];
    for (let i = 0; i < paginatedDatas.length; i++) {
      results.push({
        tuition_revenue_id: paginatedDatas[i].id,
        code: paginatedDatas[i].revenue?.code,
        name: paginatedDatas[i].revenue?.name,
        content: paginatedDatas[i].content,
        money: paginatedDatas[i].money
      });
    }

    response.data = results;
    response.number = results.length;
    response.total = totalDatas;
    return response;
  }

  async createRevenue(createDto: CreateTuitionRevenueDto) {
    const revenue = await this.revenueRepository.findOneBy({ id: createDto.revenue_id, delete: false })
    if (!revenue) {
      throw new HttpException(ErrorCode.revenue_not_existed, HttpStatus.NOT_FOUND);
    }
    const student = await this.findStudent(createDto.student_id);
    const tuition = await this.tuitionRepository.findOneBy({ delete: false, student_id: createDto.student_id });
    const tuitionRevenue = this.tuitionRevenueRepository.create({
      id: generatedKey.ref(32),
      tuition_id: student.tuition_id,
      start_date: tuition.start_date,
      end_date: tuition.end_date,
      ...createDto
    });
    await this.tuitionRevenueRepository.save(tuitionRevenue);
    await this.updateTuitionStatus(createDto.student_id)
  }

  async removeRevenue(tuition_revenue_id: string) {
    let tuitionRevenue = await this.tuitionRevenueRepository.findOneBy({ id: tuition_revenue_id, delete: false });
    if (!tuitionRevenue) {
      throw new HttpException(ErrorCode.tuition_revenue_not_existed, HttpStatus.NOT_FOUND);
    }
    tuitionRevenue.delete = true;
    await this.tuitionRevenueRepository.save(tuitionRevenue);
    const tuition = await this.tuitionRepository.findOneBy({ delete: false, id: tuitionRevenue.tuition_id })
    await this.updateTuitionStatus(tuition.student_id)
    return tuitionRevenue;
  }

  async exemptions(query: FilterExemptionDto) {
    let response = {
      timestamp: new Date(),
      data: [],
      skip: query.skip,
      limit: query.limit,
      number: [].length,
      total: [].length,
    };
    const exemptions = await this.tuitionExemptionRepository
      .createQueryBuilder('tuition_exemption')
      .leftJoinAndSelect('tuition_exemption.exemption', 'exemption', 'exemption.delete = :del', { del: false })
      .leftJoinAndSelect('tuition_exemption.tuition', 'tuition', ' tuition.delete = :del', { del: false })
      .leftJoinAndSelect('tuition.student', 'student', ' student.delete = :del', { del: false })
      .where({ delete: false })
      .andWhere('student.id =:studentId', { studentId: query.student_id })
      .andWhere('tuition.start_date = tuition_exemption.start_date AND tuition.end_date = tuition_exemption.end_date')
      .orderBy('tuition_exemption.update_date', 'DESC');

    let datas = await exemptions.getMany();
    if (!datas || datas.length == 0) {
      return response;
    }

    const totalDatas = datas.length;
    let paginatedDatas = (await paginate(datas, query.skip, query.limit)).items;
    let results = [];
    for (let i = 0; i < paginatedDatas.length; i++) {
      results.push({
        tuition_exemption_id: paginatedDatas[i].id,
        exemption_code: paginatedDatas[i].exemption?.code,
        exemption_name: paginatedDatas[i].exemption?.name,
        exemption_content: paginatedDatas[i].content,
        exemption_money: paginatedDatas[i].money
      });
    }

    response.data = results;
    response.number = results.length;
    response.total = totalDatas;
    return response;
  }

  async createExemption(createDto: CreateExemptionDto) {
    const exemption = await this.exemptionRepository.findOneBy({ id: createDto.exemption_id, delete: false });
    if (!exemption) {
      throw new HttpException(ErrorCode.exemption_not_existed, HttpStatus.NOT_FOUND);
    }
    const student = await this.findStudent(createDto.student_id);
    const tuition = await this.tuitionRepository.findOneBy({ delete: false, student_id: createDto.student_id });
    const tuitionExemption = this.tuitionExemptionRepository.create({
      id: generatedKey.ref(32),
      tuition_id: student.tuition_id,
      start_date: tuition.start_date,
      end_date: tuition.end_date,
      ...createDto,
    });
    await this.tuitionExemptionRepository.save(tuitionExemption);
    await this.updateTuitionStatus(createDto.student_id);
  }

  async removeExemption(tuition_exemption_id: string) {
    let tuitionExemption = await this.tuitionExemptionRepository.findOneBy({ id: tuition_exemption_id, delete: false });
    if (!tuitionExemption) {
      throw new HttpException(ErrorCode.tuition_exemption_not_existed, HttpStatus.NOT_FOUND);
    }
    tuitionExemption.delete = true;
    await this.tuitionExemptionRepository.save(tuitionExemption);
    const tuition = await this.tuitionRepository.findOneBy({ delete: false, id: tuitionExemption.tuition_id })
    await this.updateTuitionStatus(tuition.student_id)
    return tuitionExemption;
  }

  async findParentWithStudentId(studentId: string) {
    const userParent = await this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.studentsUsers', 'student_user')
      .where({ delete: false })
      .andWhere('student_user.student_id =:studentId', { studentId })
      .getOne();
    return userParent;
  }

  async paymentReminder(paymentReminderDto: PaymentReminderDto, isSendMail = true) {
    if (!paymentReminderDto.studentIds && paymentReminderDto.studentIds.length == 0) return;
    for (let i = 0; i < paymentReminderDto.studentIds.length; ++i) {
      const student = await this.findStudent(paymentReminderDto.studentIds[i].id);
      if (!student) continue;
      const query = new FilterRevenueDto();
      query.student_id = student.id;
      query.page = 1;
      query.size = this.config.get('MAX_SIZE');
      const studentRevenues = await this.revenues(query);
      const studentExemptions = await this.exemptions(query);
      const tuition = await this.tuitionRepository.findOneBy({ delete: false, student_id: student.id });

      const userParent = await this.userRepository
        .createQueryBuilder('users')
        .leftJoinAndSelect('users.studentsUsers', 'student_user')
        .where({ delete: false })
        .andWhere('student_user.student_id =:studentId', { studentId: query.student_id })
        .getOne();
      if (!userParent || !userParent.email) continue;
      const parentName = userParent.fullname;

      if (isSendMail) {
        await this.sendEmailPaymentReminder(
          parentName,
          userParent?.email,
          student,
          tuition,
          studentRevenues,
          studentExemptions,
        );
        return;
      }
      return {
        parent: {
          name: parentName,
          address: userParent.address,
        },
        student,
        tuition,
        studentRevenues,
        studentExemptions,
      };
    }
  }

  convertToMoney(obj) {
    if(!obj) return '0';
    return obj.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }


  formatDataPreSend(name: string, student: any, tuition: any, studentRevenues: any, studentExemptions: any) {
    const office = {
      name: 'Trường THPT Hoa Sen',
      banks: [
        {
          name: 'SACOMBANK',
          address: 'PGD KIẾN THIẾT - CN QUẬN 9',
          num_account: '0600.3462.7455',
        },
        {
          name: 'VIETCOMBANK',
          address: 'CN KỲ ĐỒNG, QUẬN 3, TP HCM',
          num_account: '072.1000.58.58.87',
        },
      ],
      address: 'CN KỲ ĐỒNG, QUẬN 3, TP HCM',
      avatar: 'https://media-influencer.payroller.vn/media/256/WodIQKqe-1722416400978.png',
    };

    const info_date = {
      month: this.formatDateToMMYYYY(tuition.start_date),
      start: this.formatDateToDDMMYYYY(tuition.start_date),
      end: this.formatDateToDDMMYYYY(tuition.end_date),
    };

    let total = studentRevenues.data.reduce((accumulator, currentStudent) => {
      if (currentStudent.money) {
        accumulator += currentStudent.money;
        currentStudent.money = this.convertToMoney(currentStudent.money);
      }
      return accumulator;
    }, 0);

    total = studentExemptions.data.reduce((accumulator, currentStudent) => {
      if (currentStudent.exemption_money) {
        accumulator += currentStudent.exemption_money;
        currentStudent.exemption_money = this.convertToMoney(currentStudent.exemption_money);
      }
      return accumulator;
    }, total);

    const studentFormat = {
      parent_name: name,
      code: student.code,
      name: student.full_name,
      teacher: student.teacher,
      class: student.class_school,
      cd: student.type_revenue,

      total_payable: this.convertToMoney(total),
      amount_paid: 0,
      remaining_payable: this.convertToMoney(total),
      du: 0,
    }

    return {
      office,
      info_date,
      student: studentFormat,
      studentRevenues: studentRevenues.data,
      studentExemptions: studentExemptions.data,
    }
  }

  async sendEmailPaymentReminder(name: string, email: string, student: any, tuition: any, studentRevenues: any, studentExemptions: any) {
    let recipients = [];

    const dataSend = this.formatDataPreSend(name, student, tuition, studentRevenues, studentExemptions);

    try {
      recipients.push({
        email: email,
        name: name,
        dynamic_template_data: dataSend,
      });
      return await this.smsClient.sendGridEmailPaymentReminder(recipients);
    } catch (exception) {
      console.log(exception);
      return;
    }
  }

  formatDateToDDMMYYYY(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  }

  formatDateToMMYYYY(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${month}/${year}`;
  }

  isExcel(file: Express.Multer.File) {
    const lowname = file.originalname.toLowerCase();
    if (!lowname.match(this.xlsx)) {
      return false;
    }
    return true;
  }

  validateFile(file: Express.Multer.File) {
    // Check maximum size for image and video
    if ((file.size > parseInt(this.config.get('XLSX_UPLOAD_LIMIT')))) {
      throw new HttpException(ErrorCode.file_too_large, HttpStatus.BAD_REQUEST);
    }
    // Check format by name
    const lowName = file.originalname.toLowerCase();
    if (this.isExcel(file) && !lowName.match(this.allowRex)) {
      throw new HttpException(ErrorCode.file_format_is_invalid, HttpStatus.BAD_REQUEST);
    }

    // Check format by signature
    const magicNumber = getMagicNumber(file.buffer);
    if (
      !(
        (
          magicNumber.startsWith('504B0304') // XLSX
        )
      )
    ) {
      throw new HttpException(ErrorCode.file_format_is_invalid, HttpStatus.BAD_REQUEST);
    }

    return;
  }

  async saveExcel(fileName: string, file: Express.Multer.File) {
    this.validateFile(file);
    const filesPath = this.DEFAULT_FILES_DIR_EXCEL;
    const filePath = path.join(filesPath, fileName);

    const dirPath = path.join(filesPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, file.buffer);

    return filePath;
  }

  async saveFile(userReq: UserPayload, dto: ReadFileDto, fileDto: Express.Multer.File) {
    const fileName = addTimestampToFileNames(fileDto.originalname);
    const url = await this.saveExcel(fileName, fileDto);

    const file = reader.readFile(url);
    const sheets = file.SheetNames;
    let currentTime = new Date();

    const setting = await this.settingRepository.findOneBy({ delete: false });
    let semester = SEMESTER.SEMESTER_TWO;

    for (let i = 0; i < sheets.length; i++) {
      const sheet = reader.utils.sheet_to_json(file.Sheets[file.SheetNames[i]]);
      if (i > 0) continue; // first sheet
      for (let j = 0; j < sheet.length; j++) {
        if (j < 1) continue;

        const object = JSON.parse(JSON.stringify(sheet[j]));
        if (!object?.MaHS) {
          throw new HttpException(ErrorCode.upload_file_not_success, HttpStatus.BAD_REQUEST);
        }

        const office = await this.office(object.CoSo);
        // create student
        let student = await this.studentRepository.findOneBy({ delete: false, code: object.MaHS });
        if (!student) {
          student = this.studentRepository.create({
            id: generatedKey.ref(32),
            code: object.MaHS,
            full_name: object.HoVaTen,
            gender: object.GioiTinh,
            address: object.DiaChi,
            class_school: object.Lop,
            teacher: object.GiaoVien,
            grade: object.Khoi,
            type_revenue: object.MaCheDo,
            office_id: office.id,
          });
          await this.studentRepository.save(student);
        } else {
          student.update_date = new Date();
          await this.studentRepository.save(student);
        }

        // create tuition
        const start_date = this.excelDateToJSDate(object.TuNgay);
        const end_date = this.excelDateToJSDate(object.DenNgay);
        let tuition = await this.tuitionRepository.findOneBy({ student_id: student.id, delete: false });
        const start_year = setting?.start_date_semester_one
          ? new Date(setting?.start_date_semester_one).getFullYear()
          : currentTime.getFullYear();
        const end_year = setting?.end_date_semester_three
          ? new Date(setting?.end_date_semester_three).getFullYear()
          : currentTime.getFullYear();
        if (tuition) {
          currentTime = new Date(start_date);
          if (
            currentTime >= new Date(setting.start_date_semester_one) &&
            currentTime <= new Date(setting.end_date_semester_one)
          ) {
            semester = SEMESTER.SEMESTER_ONE;
          } else if (
            currentTime >= new Date(setting.start_date_semester_two) &&
            currentTime <= new Date(setting.end_date_semester_two)
          ) {
            semester = SEMESTER.SEMESTER_TWO;
          } else if (
            currentTime >= new Date(setting.start_date_semester_three) &&
            currentTime <= new Date(setting.end_date_semester_three)
          ) {
            semester = SEMESTER.SEMESTER_THREE;
          }

          const isCurrentTimeTuition =
            new Date(tuition.start_date).getTime() === new Date(start_date).getTime() &&
            new Date(tuition.end_date).getTime() === new Date(end_date).getTime();

          if (!isCurrentTimeTuition) {
            tuition.opening_balance = object.SoDuDauKy;
            tuition.balance = tuition.balance + object.SoDuDauKy;

            await this.createReceiptForTuition(tuition);
          }

          tuition.year = `${start_year}-${end_year}`;
          tuition.semester = semester;
          tuition.student_id = student.id;
          tuition.end_date = new Date(end_date);
          tuition.start_date = new Date(start_date);
          await this.tuitionRepository.save(tuition);
        } else {
          tuition = this.tuitionRepository.create({
            id: generatedKey.ref(32),
            year: `${start_year}-${end_year}`,
            semester: semester,
            opening_balance: object.SoDuDauKy,
            balance: object.SoDuDauKy,
            student_id: student.id,
            start_date: new Date(start_date),
            end_date: new Date(end_date),
          });
          await this.tuitionRepository.save(tuition);
        }

        // create revenue
        const regimes = await this.regimeRepository.findBy({ delete: false, name: object.MaCheDo });
        const regimeRevenueIds = regimes.map((regime) => regime.revenue_id);
        const revenues = await this.revenueRepository.findBy({ delete: false, id: In(regimeRevenueIds) });
        for (const revenue of revenues) {
          for (const key in object) {
            if (object.hasOwnProperty(key) && typeof object[key] === 'string') {
              if (revenue.code == key) {
                const amountKey = `${key}${this.columnMoney}`;
                let money = parseFloat(object[amountKey]);
                if (isNaN(money)) {
                  money = 0;
                }

                const tuitionRevenue = {
                  id: generatedKey.ref(32),
                  tuition_id: tuition.id,
                  revenue_id: revenue.id,
                  content: object[key],
                  money: money,
                  description: '',
                  start_date: new Date(start_date),
                  end_date: new Date(end_date),
                };
                await this.tuitionRevenueRepository.save(tuitionRevenue);
              }
            }
          }
        }

        // create exemptions
        const exemptions = await this.exemptionRepository.findBy({ delete: false });
        for (const exemption of exemptions) {
          for (const key in object) {
            if (object.hasOwnProperty(key) && typeof object[key] === 'string') {
              if (exemption.code == key) {
                const amountKey = `${key}${this.columnMoney}`;
                let money = parseFloat(object[amountKey]);
                if (isNaN(money)) {
                  money = 0;
                }

                const tuitionExemption = {
                  id: generatedKey.ref(32),
                  tuition_id: tuition.id,
                  exemption_id: exemption.id,
                  content: object[key],
                  money: Math.abs(money),
                  description: '',
                  start_date: new Date(start_date),
                  end_date: new Date(end_date),
                };
                await this.tuitionExemptionRepository.save(tuitionExemption);
              }
            }
          }
        }
        await this.tuitionRepository.save(tuition);

        // update status tuition
        await this.updateTuitionStatus(student.id);

        // create user
        if (object.Email) {
          let user = await this.userService.findByUserName(object.Email);
          if (!user) {
            const userNew: CreateNewUser = {
              email: object.Email,
              role: TypeUser.Parent,
            };
            user = await this.userService.create(userReq, userNew);
          }
          const studentUser = await this.studentUserRepository.findOneBy({ student_id: student.id, delete: false })
          if (!studentUser) {
            const studentUserNew = {
              id: generatedKey.ref(32),
              student_id: student.id,
              user_id: user.id,
            };
            await this.studentUserRepository.save(studentUserNew);
          }
        }
      }
    }
  }

  async createReceiptForTuition(tuition: Tuition): Promise<Receipt> {
    const tuitionExemptions = await this.tuitionExemptionRepository
      .createQueryBuilder('tuition_exemption')
      .where('tuition_exemption.receipt is null')
      .andWhere({
        delete: false,
        tuition_id: tuition.id,
      })
      .getMany();

    const tuitionRevenues = await this.tuitionRevenueRepository
      .createQueryBuilder('tuition_revenue')
      .where('tuition_revenue.receipt is null')
      .andWhere({
        delete: false,
        tuition_id: tuition.id,
      })
      .getMany();

    if (tuitionExemptions.length === 0 && tuitionRevenues.length === 0) {
      return;
    }

    const student = await this.studentRepository
      .createQueryBuilder('student')
      .leftJoinAndSelect('student.office', 'office')
      .where('student.id = :studentId', { studentId: tuition.student_id })
      .getOne();

    const amountReceipt = await this.receiptRepository
      .createQueryBuilder('receipt')
      .select('SUM(receipt.total)', 'total_paid')
      .select('SUM(receipt.balance)', 'balance')
      .where('receipt.student_id = :studentId', { studentId: student.id })
      .andWhere('receipt.start_date = :start_date', { start_date: tuition.start_date })
      .andWhere('receipt.end_date = :end_date', { end_date: tuition.end_date })
      // .andWhere('receipt.status = :status', { status: TuitionStatus.PAID })
      .andWhere('receipt.delete = :delete', { delete: false })
      .getRawOne();

    const totalExemption = tuitionExemptions.length === 0 ? 0 : tuitionExemptions.reduce((sum, x) => sum + x.money, 0);
    const totalRevenue = tuitionRevenues.length === 0 ? 0 : tuitionRevenues.reduce((sum, x) => sum + x.money, 0);

    const months = getMonthFromDateRange(tuition.start_date, tuition.end_date);

    let receipt = new Receipt();
    receipt.id = generatedKey.ref(32);
    receipt.start_date = tuition.start_date;
    receipt.end_date = tuition.end_date;
    receipt.receipt_number = getReceiptNumber();
    receipt.title = `HỌC PHÍ THÁNG ${months.join(', ')} TỪ NGÀY ${dateFormatDisplay(
      tuition.start_date,
    )} - ${dateFormatDisplay(tuition.end_date)}`;
    receipt.student_id = student.id;
    receipt.student_code = student.code;
    receipt.student_name = student.full_name;
    receipt.year = tuition.year;
    receipt.semester = tuition.semester;
    receipt.note = `Tiền học phí tháng ${months.join(', ')} năm học ${tuition.year} và phụ thu`;
    receipt.balance = tuition.opening_balance - amountReceipt.balance;
    receipt.paid = 0;
    receipt.total = totalRevenue - totalExemption - (tuition.opening_balance - amountReceipt.balance);
    receipt.exemption = totalExemption;
    receipt.payment_method = PAYMENT_METHOD.ONLINE;
    receipt.status = TuitionStatus.UNPAID;
    receipt.tuitionExemptions = tuitionExemptions;
    receipt.tuitionRevenues = tuitionRevenues;

    receipt = await this.receiptRepository.save(receipt);

    return receipt;
  }

  excelDateToJSDate(excelDate: any): Date {
    if (typeof excelDate === 'number' && !isNaN(excelDate)) {
      const excelEpochStart = new Date(Date.UTC(1899, 11, 30));

      const daysOffset = excelDate < 60 ? 0 : 1;
      return new Date(excelEpochStart.getTime() + (excelDate - 1 + daysOffset) * 24 * 60 * 60 * 1000);
    } else if (typeof excelDate === 'string') {
      return this.parseDate(excelDate)
    }

    return new Date();
  }

  parseDate(dateString: string): Date {
    const [day, month, year] = dateString.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  async office(name: string) {
    let officeEntity = await this.officeRepository.findOneBy({ name: name, delete: false });
    if (officeEntity) return officeEntity;
    officeEntity = await this.officeRepository.create({ id: generatedKey.ref(32), name: name });
    await this.officeRepository.save(officeEntity);
    return officeEntity;
  }

  async officeFindId(id: string) {
    return await this.officeRepository.findOneBy({ id: id, delete: false });
  }

  async updateTuitionStatus(studentId: string) {
    let tuition = await this.tuitionRepository
      .createQueryBuilder('tuition')
      .leftJoinAndSelect('tuition.tuitionRevenues', 'tuition_revenue', 'tuition_revenue.delete = :del', { del: false })
      .leftJoinAndSelect('tuition.tuitionExemptions', 'tuition_exemption', 'tuition_exemption.delete = :del', {
        del: false,
      })
      .where({ student_id: studentId, delete: false })
      .andWhere('tuition.start_date =tuition_revenue.start_date AND tuition.end_date =tuition_revenue.end_date')
      .andWhere('tuition.start_date =tuition_exemption.start_date AND tuition.end_date =tuition_exemption.end_date')
      .getOne();
    if (!tuition) {
      tuition = await this.tuitionRepository.findOneBy({ delete: false, student_id: studentId });
      tuition.status = TuitionStatus.UNPAID;
      await this.tuitionRepository.save(tuition);
      return;
    }

    const exemption = tuition.tuitionExemptions.reduce((sum, x) => sum + x.money, 0);
    const revenue = tuition.tuitionRevenues.length === 0 ? 0 : tuition.tuitionRevenues.reduce((sum, x) => sum + x.money, 0);

    // Receipt
    const receipts = await this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.tuitionExemptions', 'tuition_exemption', 'tuition_exemption.delete = :del', {
        del: false,
      })
      .leftJoinAndSelect('receipt.tuitionRevenues', 'tuition_revenue', 'tuition_revenue.delete = :del', {
        del: false,
      })
      .where({
        student_id: studentId,
        delete: false,
        start_date: tuition.start_date,
        end_date: tuition.end_date,
        status: TuitionStatus.PAID,
      })
      .getMany();

    let receiptPaid = 0;
    let totalBalanceReceipt = 0;
    for (const receipt of receipts) {
      receiptPaid += receipt.paid ?? 0;
      totalBalanceReceipt += receipt.balance;
    }

    const balance = (tuition.opening_balance ?? 0) - totalBalanceReceipt; // số dư
    const total_payable = revenue - exemption - tuition.opening_balance; // tổng phải nộp
    const amount_paid = receiptPaid; // số tiền đã đóng
    const remaining_payable = total_payable - amount_paid; // số tiền còn lại
    let tuitionStatus = TuitionStatus.PAID;
    if (amount_paid <= 0) {
      tuitionStatus = TuitionStatus.UNPAID;
    } else if (amount_paid > 0 && amount_paid < total_payable + balance) {
      // -- balance số âm
      tuitionStatus = TuitionStatus.PARTIALLY_PAID;
    } else if (remaining_payable >= total_payable + balance) {
      tuitionStatus = TuitionStatus.PAID;
    }

    // const tuition = await this.tuitionRepository.findOneBy({ delete: false, student_id: studentId });
    tuition.status = tuitionStatus;
    tuition.balance = balance;
    tuition.total_payable = total_payable;
    tuition.remaining_payable = remaining_payable;
    tuition.amount_paid = amount_paid;
    await this.tuitionRepository.save(tuition);
  }

  async getUsernameByStudentId(studentId: string): Promise<string | null> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.studentsUsers', 'studentUser', 'studentUser.delete = :del', { del: false })
      .leftJoinAndSelect('studentUser.student', 'student', 'student.delete = :del', { del: false })
      .where('student.id = :studentId', { studentId })
      .select(['user.username'])
      .getOne();

    return user?.username || null;
  }

  async getNameByOfficeId(officeId: string): Promise<string | null> {
    const office = await this.officeRepository.findOneBy({ delete: false, id: officeId });

    return office?.name || null;
  }

  async exportTuitions(sls: SelectedTuitionsDto): Promise<{ dataBuffer: Buffer; templateBuffer: Buffer }> {
    const tuitions = await this.tuitionRepository.find({
      where: { delete: false },
      relations: ['student', 'tuitionRevenues', 'tuitionExemptions'],
    });

    const filteredTuitions = sls.is_select_all ? tuitions : tuitions.filter((tuition) => sls.tuition_ids.includes(tuition.id));

    const allRevenueTypes = new Set<string>();
    filteredTuitions.forEach((tuition) => {
      tuition.tuitionRevenues.forEach((revenue) => {
        allRevenueTypes.add(revenue.content);
      });
    });
    const revenueTypes = Array.from(allRevenueTypes).sort();

    const allExemptions = new Set<string>();
    filteredTuitions.forEach((tuition) => {
      tuition.tuitionExemptions.forEach((exemption) => {
        allExemptions.add(exemption.content);
      });
    });
    const exemptionTypes = Array.from(allExemptions).sort();
    const hasRevenues = revenueTypes.length > 0;
    const hasExemptions = exemptionTypes.length > 0;

    const header = [
      'MaHS',
      'HoVaTen',
      'GioiTinh',
      'DiaChi',
      'Email',
      'SDT',
      'Lop',
      'GiaoVien',
      'CoSo',
      'Khoi',
      'MaCheDo',
      'TuNgay',
      'DenNgay',
      'SoDuDauKy',
      ...(hasRevenues ? revenueTypes.flatMap((type) => [type, `${type}_SoTien`]) : []),
      ...(hasExemptions ? exemptionTypes.flatMap((type) => [type, `${type}_SoTien`]) : []),
      'TongPhaiNop',
      'ConPhaiNop',
    ];

    const header1 = [
      'MÃ',
      'Họ và tên',
      'Giới tính',
      'Địa chỉ',
      'Email phụ huynh',
      'SDT',
      'Lớp',
      'Giáo viên',
      'Cơ sở',
      'Khối',
      'Mã chế độ',
      'Từ ngày',
      'Đến ngày',
      'Số dư đầu kỳ',
      ...(hasRevenues ? revenueTypes.flatMap((type) => [type, `Số tiền`]) : []),
      ...(hasExemptions ? exemptionTypes.flatMap((type) => [type, `Số tiền`]) : []),
      'Tổng phải nộp',
      'Còn phải nộp',
    ];

    const data = await Promise.all(
      filteredTuitions.map(async (tuition) => {
        const email = await this.getUsernameByStudentId(tuition.student.id);
        const office_name = await this.getNameByOfficeId(tuition.student.office_id);
        const row: any[] = [
          tuition.student.code,
          tuition.student.full_name,
          tuition.student.gender,
          tuition.student.address,
          email,
          tuition.student.phone,
          tuition.student.class_school,
          tuition.student.teacher,
          office_name,
          tuition.student.grade,
          tuition.student.type_revenue,
          tuition.start_date,
          tuition.end_date,
          tuition.opening_balance,
        ];
        revenueTypes.forEach((type) => {
          const revenue = tuition.tuitionRevenues.find((rev) => rev.content === type);
          row.push(revenue ? revenue.content : '', revenue ? revenue.money : '');
        });
        exemptionTypes.forEach((type) => {
          const exemption = tuition.tuitionExemptions.find((rev) => rev.content === type);
          row.push(exemption ? exemption.content : '', exemption ? exemption.money : '');
        });

        row.push(tuition.total_payable, tuition.remaining_payable);

        return row;
      }),
    );

    const dataWorkbook = new ExcelJS.Workbook();
    const dataWorksheet = dataWorkbook.addWorksheet('Tuitions');

    const templateWorkbook = new ExcelJS.Workbook();
    const templateWorksheet = templateWorkbook.addWorksheet('Template');

    dataWorksheet.addRow(header);
    dataWorksheet.addRow(header1);
    templateWorksheet.addRow(header);
    templateWorksheet.addRow(header1);

    if (filteredTuitions.length > 0) {
      data.forEach((row) => dataWorksheet.addRow(row));
    }
    const getColumnLetter = (index: number) => String.fromCharCode(65 + index);
    const columns = header.map((_, index) => getColumnLetter(index));

    columns.forEach((col) => {
      dataWorksheet.getCell(`${col}1`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'd0CECE' },
      };
      dataWorksheet.getCell(`${col}2`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '8eaadb' },
      };
      templateWorksheet.getCell(`${col}1`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'd0CECE' },
      };
      templateWorksheet.getCell(`${col}2`).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '8eaadb' },
      };
      dataWorksheet.getCell(`${col}2`).font = {
        bold: true,
      };
      templateWorksheet.getCell(`${col}2`).font = {
        bold: true,
      };
    });

    // format data
    const applyFormat = (worksheet: ExcelJS.Worksheet) => {
      for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex++) {
        for (let colIndex = 1; colIndex <= columns.length; colIndex++) {
          const cell = worksheet.getCell(rowIndex, colIndex);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
        }
      }
      const headerRange = worksheet.getRow(1);
      headerRange.font = { size: 14, name: 'Times New Roman', bold: true };

      const header1Range = worksheet.getRow(2);
      header1Range.font = { size: 13, name: 'Times New Roman', bold: true };

      for (let rowIndex = 3; rowIndex <= worksheet.rowCount; rowIndex++) {
        const dataRow = worksheet.getRow(rowIndex);
        dataRow.font = { size: 10, name: 'Times New Roman' };
      }
      worksheet.columns.forEach((column) => {
        let maxLength = 0;

        column.values.forEach((value) => {
          if (typeof value === 'string') {
            maxLength = Math.max(maxLength, value.length);
          } else if (typeof value === 'number') {
            maxLength = Math.max(maxLength, value.toString().length);
          }
        });
        column.width = maxLength + 5;
      });
    };

    applyFormat(dataWorksheet);
    applyFormat(templateWorksheet);

    const openingBalanceIndex = header.indexOf('SoDuDauKy');
    const totalPayableIndex = header.indexOf('TongPhaiNop');
    const remainingPayableIndex = header.indexOf('ConPhaiNop');

    const highlightColumns = [
      getColumnLetter(openingBalanceIndex),
      getColumnLetter(totalPayableIndex),
      getColumnLetter(remainingPayableIndex),
    ];

    const applyColorToColumns = (worksheet: ExcelJS.Worksheet) => {
      highlightColumns.forEach((col) => {
        for (let rowIndex = 1; rowIndex <= worksheet.rowCount; rowIndex++) {
          const cell = worksheet.getCell(`${col}${rowIndex}`);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'b6d7a8' },
          };
        }
      });
    };

    const applyColorToHeaderRow = (
      worksheet: ExcelJS.Worksheet,
      header1: string[],
      revenueTypes: string[],
      exemptionTypes: string[],
    ) => {
      const getColumnLetter = (index: number) => String.fromCharCode(65 + index);

      const revenueColumns = header1.flatMap((headerText, index) => {
        if (revenueTypes.some((type) => headerText === type)) {
          return [getColumnLetter(index), getColumnLetter(index + 1)];
        }
        return [];
      });

      const exemptionColumns = header1.flatMap((headerText, index) => {
        if (exemptionTypes.some((type) => headerText === type)) {
          return [getColumnLetter(index), getColumnLetter(index + 1)];
        }
        return [];
      });

      revenueColumns.forEach((col) => {
        const color = 'ffd965';
        worksheet.getCell(`${col}2`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };
        worksheet.getCell(`${col}2`).font = {
          bold: true,
        };
      });

      exemptionColumns.forEach((col) => {
        const color = 'f6b26b';
        worksheet.getCell(`${col}2`).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: color },
        };
        worksheet.getCell(`${col}2`).font = {
          bold: true,
        };
      });
    };

    applyColorToHeaderRow(dataWorksheet, header1, revenueTypes, exemptionTypes);

    applyColorToColumns(dataWorksheet);
    applyColorToColumns(templateWorksheet);

    const dataBuffer = await dataWorkbook.xlsx.writeBuffer();
    const templateBuffer = await templateWorkbook.xlsx.writeBuffer();
    return {
      dataBuffer: Buffer.from(dataBuffer),
      templateBuffer: Buffer.from(templateBuffer),
    };
  }

  async findParent(studentId: string) {
    const userParent = await this.userRepository.createQueryBuilder("users")
      .leftJoinAndSelect('users.studentsUsers', 'student_user')
      .where({ delete: false })
      .andWhere('student_user.student_id =:studentId', { studentId })
      .getOne();
    return userParent;
  }

  async exportTuition() {
    const students = await this.studentRepository.find({ where: { delete: false } });
    const query = new FilterRevenueDto();
    query.page = 1;
    query.size = Number.MAX_VALUE;

    const getData = async (cb) => {
      const map = new Map();
      for (const student of students) {
        query.student_id = student.id;
        const results = await cb(query);
        results.data.forEach((res) => {
          if(!res.code && !res.exemption_code) return;
          map.set(res.code || res.exemption_code, res.name || res.exemption_name);
        });
      }
      return map;
    };

    const revenues = await getData(this.revenues.bind(this));
    const exemptions = await getData(this.exemptions.bind(this));
    // console.log([...revenues.keys()])
    const header0 = [
      this.config.get('MaHS'),
      this.config.get('HoVaTen'),
      this.config.get('GioiTinh'),
      this.config.get('DiaChi'),
      this.config.get('Email'),
      this.config.get('SDT'),
      this.config.get('Lop'),
      this.config.get('GiaoVien'),
      this.config.get('CoSo'),
      this.config.get('Khoi'),
      this.config.get('MaCheDo'),
      this.config.get('TuNgay'),
      this.config.get('DenNgay'),
      this.config.get('SoDuDauKy'),
      ...([...revenues.keys()].flatMap((x) => [x, `${x}_SoTien`])),
      ...([...exemptions.keys()].flatMap((x) => [x, `${x}_SoTien`])),
      this.config.get('TongPhaiNop'),
      this.config.get('ConPhaiNop'),
    ];

    const header1 = [
      this.config.get('MaHS_TV'),
      this.config.get('HoVaTen_TV'),
      this.config.get('GioiTinh_TV'),
      this.config.get('DiaChi_TV'),
      this.config.get('Email_TV'),
      this.config.get('SDT_TV'),
      this.config.get('Lop_TV'),
      this.config.get('GiaoVien_TV'),
      this.config.get('CoSo_TV'),
      this.config.get('Khoi_TV'),
      this.config.get('MaCheDo_TV'),
      this.config.get('TuNgay_TV'),
      this.config.get('DenNgay_TV'),
      this.config.get('SoDuDauKy_TV'),
      ...([...revenues.values()].flatMap((x) => [x, `Số tiền`])),
      ...([...exemptions.values()].flatMap((x) => [x, `Số tiền`])),
      this.config.get('TongPhaiNop_TV'),
      this.config.get('ConPhaiNop_TV'),
    ];

    const processData = async () => {
      const results = []
      for (const student of students) {
        const parent = await this.findParent(student.id);
        const stden = await this.findStudent(student.id);
        const office = await this.officeFindId(student.office_id);
        const tuition = await this.tuitionRepository.findOneBy({ delete: false, id: stden.tuition_id })
        const row = [
          student.code,
          student.full_name,
          student.gender,
          student.address,
          parent.email,
          student.phone,
          student.class_school,
          student.teacher,
          office.name,
          student.grade,
          student.type_revenue,
          this.formatDateToDDMMYYYY(tuition.start_date),
          this.formatDateToDDMMYYYY(tuition.end_date),
          this.convertToMoney(stden.opening_balance),
        ];

        query.student_id = student.id;
        const revenue = (await this.revenues(query)).data;
        for (const rev of revenues.keys()) {
          const check = revenue.find(x => x.code === rev)
          row.push(check?.content ? check.content : '')
          row.push(check?.money ? this.convertToMoney(check.money) : '')
        }

        const exemption = (await this.exemptions(query)).data;
        for (const exe of exemptions.keys()) {
          const check = exemption.find(x => x.exemption_code === exe)
          row.push(check?.exemption_content ? check.exemption_content : '')
          row.push(check?.exemption_money ? this.convertToMoney(check.exemption_money) : '')
        }

        row.push(this.convertToMoney(stden.total_payable))
        row.push(this.convertToMoney(stden.remaining_payable))
        results.push(row)
      }
      return results;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('tuitions');
    try {
      const results = await processData();
      var x = header0.indexOf(this.config.get('HoVaTen'));
      // sort a-z
      const sortedResults = results.sort((a, b) => {
        const getLastName = (fullName) => fullName.split(' ').slice(-1).join(' ');
        const getFirstName = (fullName) => fullName.split(' ').slice(0, -1).join(' ');
      
        const lastNameA = getLastName(a[x]);
        const lastNameB = getLastName(b[x]);
      
        if (lastNameA !== lastNameB) {
          return lastNameA.localeCompare(lastNameB);
        }
      
        const firstNameA = getFirstName(a[x]);
        const firstNameB = getFirstName(b[x]);
      
        return firstNameA.localeCompare(firstNameB);
      });
      worksheet.addRows([header0, header1, ...sortedResults]);
  
      for (let i = 1; i <= worksheet.rowCount; i++) {
        for (let j = 1; j <= worksheet.columnCount; j++) {
          const cell = worksheet.getCell(i, j);
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
          };
        }
      }
      // fit max length
      worksheet.columns.forEach(column => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, cell => {
          if (cell.value && cell.value.toString().length > maxLength) {
            maxLength = cell.value.toString().length;
          }
        });
        column.width = maxLength + 3;
      });
  
      const row2 = worksheet.getRow(2);
      row2.font = { bold: true };
      var styleColumn = [
        this.config.get('SoDuDauKy'),
        this.config.get('TongPhaiNop'),
        this.config.get('ConPhaiNop'),
      ]
  
      const drawColorRow = (row, begin, end, color) => {
        for (let j = begin; j <= end; j++) {
          const cell = worksheet.getCell(row, j);
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color },
          };
        }
      }
      // draw color row 1
      drawColorRow(1, 1, worksheet.columnCount, 'd0cece');
  
      // draw color row 2
      var sddk_index = header0.indexOf(styleColumn[0]);
      var last_index_revenue = sddk_index + [...revenues.keys()].length * 2 + 1;
      drawColorRow(2, 1, sddk_index, '8eaadb');
      drawColorRow(2, sddk_index + 2, last_index_revenue, 'ffd965');
      drawColorRow(2, last_index_revenue + 1, worksheet.columnCount - 2, 'f6b26b');
  
      // draw color colum [ 'SoDuDauKy', 'TongPhaiNop', 'ConPhaiNop', ]
      styleColumn.forEach((x) => {
        var j = header0.indexOf(x) + 1;
        for (let i = 1; i <= worksheet.rowCount; i++) {
          drawColorRow(i, j, j, 'b6d7a8');
        }
      })
  
      const dataBuffer = await workbook.xlsx.writeBuffer();
      return dataBuffer;
    } catch (error) {
      console.log(error)
    }
   
  }
}

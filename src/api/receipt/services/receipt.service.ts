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
  EduBillBill,
  EduBillTransaction,
} from '@/database/entity';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { paginate, removeAccents, sortByFirstname } from '../../../shared/utility';
import path from 'path';
import fs from 'fs';
import { UsersService } from '../../users/services/users.service';
import { OrderBy, SortBy } from '../../users/dto';
import { TuitionStatus } from '../../../common/enum/tuition_status.enum';
import { ConfigService } from '@nestjs/config';
import { FilterHistoryReceiptDto, FilterReceiptDto } from '../dto/filter-receipt.dto';
import { SMSClient } from '../../../common/client_services/sms-client';
import { TuitionService } from '@/api/tuition/services/tuition.service';
import * as pdf from 'pdf-creator-node';
import { PaymentReminderDto } from '@/api/tuition/dto/create-tuition.dto';
import { CreateReceiptDto, DeleteReceiptDto } from '../dto/create-receipt.dto';
import { PAYMENT_METHOD } from '../../../common/enum/receipt.enum';
import { doReadNumber, ReadingConfig } from 'read-vietnamese-number';

const config = new ReadingConfig();
config.unit = ['đồng'];

@Injectable()
export class ReceiptService {
  private readonly logger = new Logger(ReceiptService.name);

  constructor(@InjectRepository(Tuition, 'postgres') private readonly tuitionRepository: Repository<Tuition>,
    @InjectRepository(User, 'postgres') private readonly userRepository: Repository<User>,
    @InjectRepository(Office, 'postgres') private readonly officeRepository: Repository<Office>,
    @InjectRepository(Student, 'postgres') private readonly studentRepository: Repository<Student>,
    @InjectRepository(Revenue, 'postgres') private readonly revenueRepository: Repository<Revenue>,
    @InjectRepository(Regime, 'postgres') private readonly regimeRepository: Repository<Regime>,
    @InjectRepository(Exemption, 'postgres') private readonly exemptionRepository: Repository<Exemption>,
    @InjectRepository(TuitionRevenue, 'postgres') private readonly tuitionRevenueRepository: Repository<TuitionRevenue>,
    @InjectRepository(TuitionExemption, 'postgres') private readonly tuitionExemptionRepository: Repository<TuitionExemption>,
    @InjectRepository(StudentUser, 'postgres') private readonly studentUserRepository: Repository<StudentUser>,
    @InjectRepository(Setting, 'postgres') private readonly settingRepository: Repository<Setting>,
    @InjectRepository(Receipt, 'postgres') private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(EduBillBill, 'postgres') private readonly eduBillBillRepository: Repository<EduBillBill>,
    @InjectRepository(EduBillTransaction, 'postgres') private readonly eduBillTransactionRepository: Repository<EduBillTransaction>,

    private smsClient: SMSClient,
    private config: ConfigService,
    private tuitionService: TuitionService,
    private userService: UsersService,
  ) {}

  async lists(query: FilterReceiptDto) {
    const response = {
      timestamp: new Date(),
      data: [],
      skip: query.skip,
      limit: query.limit,
      number: [].length,
      total: [].length,
    };
    let receipts = await this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.edu_bill', 'edubill_bill', 'edubill_bill.delete = :del', { del: false })
      .leftJoinAndSelect('edubill_bill.transaction', 'edubill_transaction', ' edubill_transaction.delete = :del', {
        del: false,
      })
      .orderBy('receipt.update_date', 'DESC')
      .where({ delete: false })
      .getMany();

    if (!receipts || receipts.length == 0) {
      return response;
    }

    if (query.student_name) {
      receipts = receipts.filter((rs) => {
        let matchName = true;
        if (rs.student_name === null) {
          matchName = false;
        } else if (query.student_name) {
          matchName = removeAccents(rs.student_name.toLowerCase()).includes(
            removeAccents(query.student_name.toLowerCase()),
          );
        }

        return matchName;
      });
    }

    const totalDatas = receipts.length;
    const paginatedDatas = paginate(receipts, query.skip, query.limit).items;
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
    const students = await this.studentRepository.findBy({ delete: false });
    for (let i = 0; i < paginatedDatas.length; i++) {
      const student = students.find((student) => student.id === paginatedDatas[i].student_id);
      results.push({
        id: paginatedDatas[i].id,
        student_id: paginatedDatas[i].student_id,
        student_name: paginatedDatas[i].student_name,
        class_school: student?.class_school ?? '',
        lastname:
          paginatedDatas[i].student_name === null
            ? ''
            : paginatedDatas[i].student_name.substring(0, paginatedDatas[i].student_name.indexOf(' ')),
        firstname:
          paginatedDatas[i].student_name === null
            ? ''
            : paginatedDatas[i].student_name.substring(paginatedDatas[i].student_name.lastIndexOf(' ') + 1),

        receipt_number: paginatedDatas[i].receipt_number,
        collection_date: paginatedDatas[i].collection_date ?? '',
        trans_id: paginatedDatas[i].trans_id ?? '',
        paid: paginatedDatas[i]?.paid ?? 0,
        fee_type: 'Học phí',
        payment_method: paginatedDatas[i].payment_method ?? '',
        edit_available: paginatedDatas[i].edit_available,
      });
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

  async findReceipt(receiptId: string) {
    const receipt = await this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.edu_bill', 'edubill_bill', 'edubill_bill.delete = :del', { del: false })
      .leftJoinAndSelect('edubill_bill.transaction', 'edubill_transaction', ' edubill_transaction.delete = :del', {
        del: false,
      })
      .where({ delete: false, id: receiptId })
      .getOne();

    if (!receipt) {
      throw new HttpException(ErrorCode.receipt_not_existed, HttpStatus.NOT_FOUND);
    }

    const student = await this.studentRepository.findOneBy({ id: receipt.student_id });
    let office: Office = null;
    if (student) office = await this.officeRepository.findOneBy({ delete: false, id: student.office_id });
    const response = {
      id: receipt.id,
      student: {
        id: receipt.student_id,
        code: receipt.student_code,
        full_name: receipt.student_name,
        class_school: student?.class_school ?? '',
      },
      office,

      receipt_number: receipt.receipt_number,
      collection_date: receipt.collection_date ?? '',
      trans_id: receipt.trans_id ?? '',
      paid: receipt.paid ?? 0,
      title: receipt.title ?? '',
      pay_by: receipt.pay_by ?? '',
      edit_available: receipt.edit_available,
    };
    return response;
  }

  async validateReceipt(dto: CreateReceiptDto, idReceipt: string) {
    const office = await this.officeRepository.findOneBy({ delete: false, id: dto.office_id });
    if (!office) {
      throw new HttpException(ErrorCode.office_not_existed, HttpStatus.NOT_FOUND);
    }

    const student = await this.studentRepository.findOneBy({
      delete: false,
      code: dto.student_code,
      office_id: dto.office_id,
    });
    if (!student) {
      throw new HttpException(ErrorCode.student_not_existed, HttpStatus.NOT_FOUND);
    }

    if (!idReceipt) {
      const receipts = await this.receiptRepository.findBy({ delete: false });
      if (receipts.filter((x) => x.receipt_number == dto.receipt_number).length > 0) {
        throw new HttpException(ErrorCode.receipt_number_existed, HttpStatus.BAD_REQUEST);
      }

      if (receipts.filter((x) => x.trans_id == dto.trans_id).length > 0) {
        throw new HttpException(ErrorCode.trans_id_existed, HttpStatus.BAD_REQUEST);
      }
    } else {
      const receiptReceiptNumber = await this.receiptRepository
        .createQueryBuilder('receipt')
        .where('receipt.id != :id', { id: idReceipt })
        .andWhere('receipt.receipt_number =:receipt_number', { receipt_number: dto.receipt_number })
        .andWhere('receipt.delete =:delete', { delete: false })
        .getOne();

      if (receiptReceiptNumber) {
        throw new HttpException(ErrorCode.receipt_number_existed, HttpStatus.BAD_REQUEST);
      }

      const receiptTransId = await this.receiptRepository
        .createQueryBuilder('receipt')
        .where('receipt.id != :id', { id: idReceipt })
        .andWhere('receipt.trans_id = :trans_id', { trans_id: dto.trans_id })
        .andWhere('receipt.delete = :delete', { delete: false })
        .getOne();
      if (receiptTransId) {
        throw new HttpException(ErrorCode.trans_id_existed, HttpStatus.BAD_REQUEST);
      }
    }

    return student;
  }

  async createReceipt(createDto: CreateReceiptDto, user: User) {
    const student = await this.validateReceipt(createDto, null);
    const tuition = await this.tuitionRepository.findOneBy({ delete: false, student_id: student.id });
    const data = this.receiptRepository.create({
      ...createDto,
      id: generatedKey.ref(32),
      student_id: student.id,
      year: tuition?.year ? tuition?.year : '',
      semester: tuition?.semester,
      start_date: tuition?.start_date,
      end_date: tuition?.end_date,
      payment_method: PAYMENT_METHOD.OFFLINE,
      status: TuitionStatus.PAID,
      create_by: `${user.username}${user.fullname ? ' - (' + user.fullname + ')' : ''}`,
      pay_by: createDto.pay_by,
      edit_available: true,
    });
    await this.receiptRepository.save(data);

    tuition.total_payable = tuition.total_payable + createDto.paid;
    tuition.amount_paid = tuition.amount_paid + createDto.paid;
    await this.tuitionRepository.save(tuition);

    return data;
  }

  async updateReceipt(id, updateDto: CreateReceiptDto) {
    const receipt = await this.receiptRepository.findOneBy({ delete: false, id: id });
    if (!receipt) {
      throw new HttpException(ErrorCode.receipt_not_existed, HttpStatus.NOT_FOUND);
    }

    if (!receipt.edit_available) {
      throw new HttpException(ErrorCode.receipt_not_editable, HttpStatus.BAD_REQUEST);
    }

    await this.validateReceipt(updateDto, receipt.id);
    await this.receiptRepository.save({ ...receipt, ...updateDto });
    return receipt;
  }

  async removeReceipts(deleteDto: DeleteReceiptDto) {
    const ids = deleteDto.ids.map((idDto) => idDto.id);
    const receipts = await this.receiptRepository.find({ where: { id: In(ids), delete: false, edit_available: true } });
    if (receipts.length != deleteDto.ids.length) {
      throw new HttpException(ErrorCode.receipt_not_existed, HttpStatus.NOT_FOUND);
    }

    receipts.forEach((e) => {
      e.delete = true;
    });
    await this.receiptRepository.save(receipts);
  }

  async historyReceipt(reqUser: any, query: FilterHistoryReceiptDto) {
    const response = {
      timestamp: new Date(),
      data: [],
      skip: query.skip,
      limit: query.limit,
      number: [].length,
      total: [].length,
    };

    const userParent = await this.userRepository
      .createQueryBuilder('users')
      .leftJoinAndSelect('users.studentsUsers', 'student_user', 'student_user.delete = :del', { del: false })
      .where({ delete: false, id: reqUser.user.userId })
      .getOne();
    let studentIds: any[] = [];
    if (userParent && userParent.studentsUsers) {
      studentIds = userParent.studentsUsers.map((studentUser) => studentUser.student_id);
    }

    let receiptsQuery = this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect('receipt.edu_bill', 'edubill_bill', 'edubill_bill.delete = :del', { del: false })
      .leftJoinAndSelect('edubill_bill.transaction', 'edubill_transaction', ' edubill_transaction.delete = :del', {
        del: false,
      })
      .orderBy('receipt.update_date', 'DESC');

    if (query.student_id) {
      receiptsQuery = receiptsQuery.where({ delete: false, student_id: query.student_id });
    } else {
      receiptsQuery = receiptsQuery.where({ delete: false, student_id: In(studentIds) });
    }

    if (query.start_date) {
      receiptsQuery = receiptsQuery.andWhere('edubill_bill.ngay_thu >= :start_date', { start_date: query.start_date });
    }

    if (query.end_date) {
      receiptsQuery = receiptsQuery.andWhere('edubill_bill.ngay_thu <= :end_date', { end_date: query.end_date });
    }

    const receipts = await receiptsQuery.getMany();
    if (!receipts || receipts.length == 0) {
      return response;
    }

    const totalDatas = receipts.length;
    const paginatedReceipts = paginate(receipts, query.skip, query.limit).items;

    const results = [];
    for (let i = 0; i < paginatedReceipts.length; i++) {
      results.push({
        id: paginatedReceipts[i].id,
        student_id: paginatedReceipts[i].student_id,
        student_name: paginatedReceipts[i].student_name,

        receipt_number: paginatedReceipts[i].receipt_number,
        collection_date: paginatedReceipts[i].collection_date ?? '',
        paid: paginatedReceipts[i]?.paid ?? 0,
        payment_method: paginatedReceipts[i].payment_method ?? '',
        title: paginatedReceipts[i].title ?? '',
      });
    }

    response.data = results;
    response.number = results.length;
    response.total = totalDatas;
    return response;
  }

  setFileName(prefix: string, name?: string) {
    const date = this.tuitionService.formatDateToDDMMYYYY(new Date()).split('/').join('');
    if (name) return `${prefix}_${name}_${date}`;
    return `${prefix}_${date}`;
  }

  async generateBufferPdf(filenameTemplate: string, data: any) {
    const html = fs.readFileSync(filenameTemplate, 'utf8');
    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: `20mm`,
    };

    const document = {
      html,
      data,
      type: 'buffer',
    };

    return await pdf.create(document, options);
  }

  // isSendMail = true is return data used for sendMail and print_total_tuition, isSendMail = false for print_receipt
  async getData(studentId: string, isSendMail = true) {
    const students: PaymentReminderDto = {
      studentIds: [{ id: studentId }],
    };

    const { parent, student, tuition, studentRevenues, studentExemptions } = await this.tuitionService.paymentReminder(
      students,
      false,
    );

    return this.tuitionService.formatDataPreSend(parent.name, student, tuition, studentRevenues, studentExemptions);
  }

  async totalTuition(studentId: string) {
    const data = await this.getData(studentId);
    try {
      const dirStore = path.resolve(__dirname, './../../../../store/');
      const fileTemplate = path.join(dirStore, 'total_tuition_template.html');

      const fileBuffer = await this.generateBufferPdf(fileTemplate, data);
      const filename = `${this.setFileName(this.config.get('TOTAL_TUITION'))}.pdf`;

      return {
        filename,
        fileBuffer,
      };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(ErrorCode.print_total_tuition_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  convertNumberToWords(number: number) {
    const result = doReadNumber(config, number.toString());
    return result.charAt(0).toUpperCase() + result.slice(1) + '.';
  }

  async printReceipt(receiptId: string) {
    const receipt = await this.findReceipt(receiptId);
    const now = new Date();

    const office = await this.tuitionService.officeFindId(receipt.office?.id);
    if (!office) {
      throw new HttpException(ErrorCode.office_not_existed, HttpStatus.NOT_FOUND);
    }

    const parent = await this.tuitionService.findParentWithStudentId(receipt.student?.id);
    if (!parent) {
      throw new HttpException(ErrorCode.user_not_existed, HttpStatus.NOT_FOUND);
    }

    try {
      if (receipt?.title) receipt.title += '.';
      if (parent?.address) parent.address += '.';
      if (!receipt?.paid) receipt.paid = 0;
      const wordPaid = this.convertNumberToWords(receipt.paid);
      let paidString = this.tuitionService.convertToMoney(receipt.paid);
      const kc = 15;
      if (paidString.length < kc) paidString += ' '.repeat(kc - paidString.length);

      const data = {
        parent: {
          name: parent?.fullname,
          address: parent?.address,
        },
        date: {
          day: now.getDate(),
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
        receipt: {
          title: receipt.title,
          paid: paidString,
          book_number: '...............',
          number: '...............',
          word_paid: wordPaid,
          info1:
            '<strong>Mẫu số 06 - TT</strong><br>(Ban hành theo Thông tư số <br>133/2016/TT-BTC ngày 26/8/2016 của <br>Bộ Tài chính)',
          info2:
            '<strong>Mẫu số 07 - TT</strong><br>(Ban hành theo Thông tư số <br>133/2016/TT-BTC ngày 26/8/2016 của <br>Bộ Tài chính)',
        },
        office: {
          name: office?.name,
          address: 'CN KỲ ĐỒNG, QUẬN 3, TP HCM',
          department: 'CN KỲ ĐỒNG, QUẬN 3, TP HCM',
          avatar: 'https://media-influencer.payroller.vn/media/256/WodIQKqe-1722416400978.png',
        },
      };

      const dirStore = path.resolve(__dirname, './../../../../store/');
      const fileTemplate = path.join(dirStore, 'receipt_template.html');

      const fileBuffer = await this.generateBufferPdf(fileTemplate, data);
      const filename = `${this.setFileName(this.config.get('RECEIPT'))}.pdf`;

      return {
        filename,
        fileBuffer,
      };
    } catch (error) {
      throw new HttpException(ErrorCode.print_receipt_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

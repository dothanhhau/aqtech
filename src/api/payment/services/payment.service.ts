import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { EduCreateBillDto, EduPhieuThuDto } from '../dto/edu-create-bill.dto';
import { EduCreateBillResponseDto } from '../dto/edu-create-bill-response.dto';
import { CreateBillRequestDto } from '../dto/create-bill-request.dto';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import {
  EduBillBill,
  EduBillTransaction,
  Receipt,
  Student,
  Tuition,
  TuitionExemption,
  TuitionRevenue,
  User,
} from '@/database/entity';
import { In, Repository } from 'typeorm';
import { ReceiptDto, ReceiptsDto } from '../dto/receipts.dto';
import { TuitionService } from '@/api/tuition/services/tuition.service';
import { TuitionStatus } from '@/common/enum/tuition_status.enum';
import { ReceiptService } from './receipt.service';
import { BillFilter } from '../dto/bill-filter.dto';
import { generatedKey } from '@/common/generatedKey';
import { StudentService } from '@/api/users/services/student.service';
import { dateFormatDisplay, getMonthFromDateRange, getReceiptNumber } from '@/shared/utility';
import { EduReceiptDto } from '../dto/edu-receipt.dto';
import { UsersService } from '@/api/users/services/users.service';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { isEmpty } from 'lodash';
import { PAYMENT_METHOD } from '@/common/enum/receipt.enum';
import { SettingService } from '@/api/setting/services/setting.service';

@Injectable()
export class PaymentService {
  logger = new Logger(PaymentService.name);
  constructor(
    @InjectRepository(EduBillBill, 'postgres') private readonly billRepository: Repository<EduBillBill>,
    @InjectRepository(EduBillTransaction, 'postgres')
    private readonly transactionRepository: Repository<EduBillTransaction>,
    @InjectRepository(Receipt, 'postgres')
    private readonly receiptRepository: Repository<Receipt>,
    @InjectRepository(TuitionExemption, 'postgres')
    private readonly exemptionRepository: Repository<TuitionExemption>,
    @InjectRepository(TuitionRevenue, 'postgres')
    private readonly revenueRepository: Repository<TuitionRevenue>,
    @InjectRepository(Tuition, 'postgres')
    private readonly tuitionRepository: Repository<Tuition>,
    private receiptService: ReceiptService,
    private config: ConfigService,
    private studentService: StudentService,
    private tuitionService: TuitionService,
    private readonly userService: UsersService,
    private readonly settingService: SettingService,
  ) {}

  async getReceipts(username: string, query: BillFilter = {}): Promise<ReceiptsDto> {
    const students = await this.studentService.getStudentsOfUserName(username);
    const user = await this.userService.findByUserName(username);
    const receiptsDto = new ReceiptsDto();
    const receipts: ReceiptDto[] = [];

    await Promise.all(
      students.map(async (student) => {
        if (query.student_id && student.id !== query.student_id) {
          return;
        }

        const results = await this.getReceiptsByStudent(student, query.receipt_id ? [query.receipt_id] : []);
        if (results && results.length > 0) {
          receipts.push(
            ...results.map((r) => {
              let receiptDto: ReceiptDto = new ReceiptDto();
              receiptDto = { ...receiptDto, ...r };
              return receiptDto;
            }),
          );
        }
      }),
    );

    receiptsDto.data.parent = {
      id: user.id,
      name: user.fullname,
      avatar: user.avatar,
      email: user.email,
      phone: user.phone,
      address: user.address,
    };
    receiptsDto.data.receipts.push(...receipts);
    return receiptsDto;
  }

  async getReceiptsByStudent(
    student: Student,
    receiptIds: string[],
    isIncludeTuition = true,
  ): Promise<(Receipt & { isNew: boolean; office_name: string })[]> {
    const receipts = [];
    const tuition = await this.tuitionService.findNotPaidByStudent(student.id);

    // Get receipts by student and id in receiptIds
    const receiptsByStudent = await this.receiptService.getReceiptsNotPaidByStudent(student.id, receiptIds);
    let newReceiptId: string = receiptIds.shift() || generatedKey.ref(32);
    const studentReceipts = receiptsByStudent.map((receipt) => {
      if (receiptIds.length > 0 && !receiptIds.includes(receipt.id)) {
        newReceiptId = receipt.id;
      }
      return {
        ...receipt,
        semester: receipt.semester,
        student_id: student.id,
        student_code: student.code,
        student_name: student.full_name,
        office_name: student.office?.name,
      };
    });
    receipts.push(...studentReceipts);

    if (!isIncludeTuition) {
      return receipts;
    }

    if (tuition) {
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

      const totalExemption =
        tuition.tuitionExemptions.length === 0 ? 0 : tuition.tuitionExemptions.reduce((sum, x) => sum + x.money, 0);
      const totalRevenue = tuition.tuitionRevenues.length === 0 ? 0 : tuition.tuitionRevenues.reduce((sum, x) => sum + x.money, 0);

      const months = getMonthFromDateRange(tuition.start_date, tuition.end_date);

      const receipt = {
        id: newReceiptId,
        isNew: true,
        start_date: tuition.start_date,
        end_date: tuition.end_date,
        receipt_number: getReceiptNumber(),
        title: `HỌC PHÍ THÁNG ${months.join(', ')} TỪ NGÀY ${dateFormatDisplay(
          tuition.start_date,
        )} - ${dateFormatDisplay(tuition.end_date)}`,
        student_id: student.id,
        student_code: student.code,
        student_name: student.full_name,
        office_name: student.office?.name,
        year: tuition.year,
        semester: tuition.semester,
        note: `Tiền học phí tháng ${months.join(', ')} năm học ${tuition.year} và phụ thu`,
        balance: tuition.opening_balance - amountReceipt.balance,
        paid: 0,
        total: totalRevenue - totalExemption - (tuition.opening_balance - amountReceipt.balance),
        exemption: totalExemption,
        payment_method: PAYMENT_METHOD.ONLINE,
        status: TuitionStatus.UNPAID,
        tuitionExemptions: tuition.tuitionExemptions,
        tuitionRevenues: tuition.tuitionRevenues,
      };
      receipts.push(receipt);
    }

    return receipts;
  }

  async createBill(createBillRequest: CreateBillRequestDto, user: User): Promise<string> {
    const student = await this.studentService.getStudentById(createBillRequest.studentId);

    if (!student) {
      throw new HttpException(ErrorCode.student_not_existed, HttpStatus.BAD_REQUEST);
    }

    const bills = await this.getReceiptsByStudent(student, [createBillRequest.receiptId]);

    if (!bills || bills.length === 0) {
      throw new HttpException(ErrorCode.receipt_not_existed, HttpStatus.BAD_REQUEST);
    }

    let bill = bills.shift();
    if (bill.isNew) {
      bill = await this.receiptRepository.save({
        ...bill,
        id: createBillRequest.receiptId,
        create_by: `${user.username}${user.fullname ? ' - (' + user.fullname + ')' : ''}`,
        pay_by: `${user.username}${user.fullname ? ' - (' + user.fullname + ')' : ''}`,
      });

      const exemptionIds = bill.tuitionExemptions.map((exemption) => {
        return exemption.id;
      });
      await this.exemptionRepository
        .createQueryBuilder('tuition_exemption')
        .where({ id: In(exemptionIds) })
        .update({ receipt: bill })
        .execute();

      const revenueIds = bill.tuitionRevenues.map((revenue) => {
        return revenue.id;
      });
      await this.revenueRepository
        .createQueryBuilder('tuition_revenue')
        .where({ id: In(revenueIds) })
        .update({ receipt: bill })
        .execute();
    }

    let eduBill = await this.billRepository
      .createQueryBuilder('edubill_bill')
      .leftJoinAndSelect('edubill_bill.transaction', 'transaction')
      .where({ receipt: createBillRequest.receiptId })
      .getOne();

    if (!eduBill) {
      let transaction = new EduBillTransaction();
      transaction = {
        ...transaction,
        id: generatedKey.ref(32),
        ma_sv: student.code,
        ten_sv: student.full_name,
        is_nhap_tien: false,
        tien_toi_thieu: 0,
        redirect_success: createBillRequest.redirectURL,
      };
      transaction = await this.transactionRepository.save(transaction);

      let revenueDetail = '';
      if (bill.tuitionRevenues) {
        bill.tuitionRevenues.forEach((tuitionRevenue) => {
          revenueDetail += `${tuitionRevenue.revenue.name} ${tuitionRevenue.content}: ${tuitionRevenue.money}<br>`;
        });
      }
      let exemptionDetail = '';
      if (bill.tuitionExemptions) {
        bill.tuitionExemptions.forEach((tuitionExemption) => {
          exemptionDetail += `${tuitionExemption.content} ${tuitionExemption.exemption.name}: ${tuitionExemption.money}<br>`;
        });
      }

      eduBill = new EduBillBill();
      eduBill = {
        ...eduBill,
        id: generatedKey.ref(32),
        stt: bill.receipt_number,
        hoc_ky: bill.year,
        so_phieu_bao: '' + bill.receipt_number,
        id_phieu_bao: bill.isNew ? createBillRequest.receiptId : bill.id,
        hoc_ky_chu: bill.year + '',
        noi_dung: bill.title,
        chi_tiet: `${isEmpty(revenueDetail) ? '' : revenueDetail + '<br>'}${exemptionDetail}`,
        trang_thai: bill.status === TuitionStatus.PAID ? 1 : 0,
        ma_loai_thu: '',
        phai_thu: bill.total - bill.paid,
        tong_thu: bill.total + bill.exemption,
        mien_giam: bill.exemption || 0,
        ngay_tao: bill.create_date,
        ngay_thu: null,
        date_line: null,
        kenh_thu: bill.payment_method,
        is_bat_buoc_thanh_toan_het: true,
        receipt: bill,
        transaction: transaction,
      };
      eduBill = await this.billRepository.save(eduBill);
    }

    // fill properties of EduPhieuThuDto by EduBillBill

    const eduBillDto: EduPhieuThuDto = {
      stt: eduBill.stt,
      hoc_ky: eduBill.hoc_ky,
      so_phieu_bao: eduBill.so_phieu_bao,
      id_phieu_bao: eduBill.id_phieu_bao,
      hoc_ky_chu: eduBill.hoc_ky_chu,
      noi_dung: eduBill.noi_dung,
      chi_tiet: eduBill.chi_tiet,
      trang_thai: eduBill.trang_thai,
      ma_loai_thu: eduBill.ma_loai_thu,
      phai_thu: eduBill.phai_thu,
      tong_thu: eduBill.tong_thu,
      mien_giam: eduBill.mien_giam,
      kenh_thu: eduBill.kenh_thu,
      is_bat_buoc_thanh_toan_het: eduBill.is_bat_buoc_thanh_toan_het,
      ngay_thu: eduBill.ngay_thu ? eduBill.ngay_thu.toISOString().split('T')[0] : null,
      ngay_tao: eduBill.ngay_tao.toISOString().split('T')[0],
      date_line: eduBill.date_line ? eduBill.date_line.toISOString().split('T')[0] : null,
    };
    const eduCreateBillDto: EduCreateBillDto = {
      ma_sv: eduBill.transaction.ma_sv,
      ten_sv: eduBill.transaction.ten_sv,
      is_nhap_tien: eduBill.transaction.is_nhap_tien,
      tien_toi_thieu: eduBill.transaction.tien_toi_thieu,
      redirect_success: eduBill.transaction.redirect_success,
      phieu_thu: [eduBillDto],
    };

    const settingConfig = await this.settingService.system();
    const edubillConfig = JSON.parse(settingConfig.edubill_config);
    const orgCode = edubillConfig.EDU_ORG_CODE;
    const schoolCode = edubillConfig.EDU_SCHOOL_CODE;
    const eduBillURL = edubillConfig.EDU_ENDPOINT;

    const url = `${eduBillURL}/organization/${orgCode}/school/${schoolCode}/bill/create`;

    const headers = {
      'Content-Type': 'application/json',
      'X-API-KEY': edubillConfig.EDU_API_KEY,
    };

    try {
      this.logger.log(`CreateEduBill: [REQUEST][POST][${url}]: ${JSON.stringify(eduCreateBillDto)}`);
      const response = await axios.post(url, eduCreateBillDto, { headers });
      this.logger.log(`CreateEduBill: [RESPONSE]:`, response.data);
      if (response.data.code !== 200) {
        this.logger.warn(`CreateEduBill: Unexpected response code: ${response.data.code}`);
        return null;
      }

      const eduBillResponse: EduCreateBillResponseDto = response.data.data;
      eduBill.transaction.payment_url = eduBillResponse.url;
      eduBill.transaction = await this.transactionRepository.save(eduBill.transaction);

      return eduBillResponse.url;
    } catch (error: AxiosError | any) {
      if (axios.isAxiosError(error)) {
        this.logger.error('CreateBillError:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
        });
      } else {
        this.logger.error('CreateBillError: An unexpected error occurred', {
          message: error.message,
          stack: error.stack,
        });
      }
      return null;
    }
  }

  async getEduBillsByReceiptIds(receiptIds: string[]): Promise<EduBillBill[]> {
    return await this.billRepository
      .createQueryBuilder('edubill_bill')
      .leftJoinAndSelect('edubill_bill.transaction', 'transaction')
      .where('edubill_bill.id_phieu_bao IN (:...receiptIds)', { receiptIds })
      .getMany();
  }

  async getTransactionByStudentCode(studentCode: string): Promise<EduBillTransaction[]> {
    return await this.transactionRepository
      .createQueryBuilder('edubill_transaction')
      .leftJoinAndSelect('edubill_transaction.phieu_thu', 'phieu_thu')
      .where('edubill_transaction.ma_sv = :studentCode', { studentCode })
      .getMany();
  }

  async syncEduReceipt(eduReceipt: EduReceiptDto) {
    try {
      const receiptIds = eduReceipt.phieu_thu.map((phieuThu) => phieuThu.id_phieu_bao);

      // Update data EDUBILL
      const eduBills = await this.getEduBillsByReceiptIds(receiptIds);
      if (!eduBills) {
        throw new Error('EduBills not found');
      }
      await Promise.all(
        eduBills.map(async (eduBill) => {
          if (!eduBill || !eduBill.transaction) {
            throw new Error('EduBill transaction not found');
          }
          eduBill.transaction.trans_id = eduReceipt.trans_id;
          eduBill.transaction.ngay_thu = eduReceipt.ngay_thu;
          eduBill.transaction.tong_da_thu = eduReceipt.tong_da_thu;
          await this.transactionRepository.save(eduBill.transaction);

          eduBill.ngay_thu = new Date(eduReceipt.ngay_thu);
          eduBill.trang_thai = 1;
          await this.billRepository.save(eduBill);
        }),
      );

      // Update data receipt
      const receipts = await this.receiptService.fetchByStudentCodeAndIdsAndNotPaid(eduReceipt.ma_sv, receiptIds);
      if (!receipts) {
        throw new Error('Receipts not found');
      }
      await Promise.all(
        receipts.map(async (receipt) => {
          if (!receipt) {
            throw new Error('Receipt not found');
          }
          receipt.paid = receipt.total;
          receipt.status = TuitionStatus.PAID;
          receipt.trans_id = eduReceipt.trans_id;
          receipt.collection_date = new Date(eduReceipt.ngay_thu);
          await this.receiptRepository.save(receipt);
        }),
      );

      const student = await this.studentService.getStudentByCode(eduReceipt.ma_sv);
      if (!student) {
        throw new Error('Student not found');
      }
      await this.tuitionService.updateTuitionStatus(student.id);
    } catch (error) {
      this.logger.error('SyncEduReceiptError:', error);
      throw error;
    }
  }
}

import { TuitionStatus } from '@/common/enum/tuition_status.enum';
import { Receipt } from '@/database/entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ReceiptService {
  constructor(@InjectRepository(Receipt, 'postgres') private readonly receiptRepository: Repository<Receipt>) {}

  async getReceiptsNotPaidByStudent(studentId: string, receiptIds: string[] = []): Promise<Receipt[]> {
    const query = this.receiptRepository
      .createQueryBuilder('receipt')
      .leftJoinAndSelect(
        'receipt.tuitionExemptions',
        'tuition_exemptions',
        'tuition_exemptions.receipt_id = receipt.id',
      )
      .leftJoinAndSelect('tuition_exemptions.exemption', 'exemption', 'exemption.delete = :delete', {
        delete: false,
      })
      .leftJoinAndSelect('receipt.tuitionRevenues', 'tuition_revenues', 'tuition_revenues.receipt_id = receipt.id')
      .leftJoinAndSelect('tuition_revenues.revenue', 'revenue', 'revenue.delete = :delete', { delete: false })
      .where('receipt.student_id = :studentId', { studentId })
      .andWhere('receipt.delete = :delete', { delete: false })
      .andWhere('receipt.status != :status', { status: TuitionStatus.PAID });
    if (receiptIds.length > 0) {
      query.andWhere('receipt.id IN (:...receiptIds)', { receiptIds });
    }
    return await query.getMany();
  }

  // async getRevenuesByStudent(studentId: string): Promise<Receipt[]> {
  //     return this.receiptDetailRepository.
  // }

  async countReceipts(): Promise<any> {
    return await this.receiptRepository.createQueryBuilder('receipt').getCount();
  }

  async fetchByStudentCodeAndIdsAndNotPaid(studentCode: string, ids: string[]): Promise<Receipt[]> {
    return await this.receiptRepository
      .createQueryBuilder('receipt')
      .where('receipt.student_code = :studentCode', { studentCode: studentCode })
      .where('receipt.id IN (:...ids)', { ids: ids })
      .andWhere('receipt.delete = :delete', { delete: false })
      .andWhere('receipt.status != :status', { status: TuitionStatus.PAID })
      .getMany();
  }
}

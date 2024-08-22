import { TuitionStatus } from '@/common/enum/tuition_status.enum';
import { TuitionExemption, TuitionRevenue } from '@/database/entity';

export class ReceiptsDto {
  data: {
    receipts: ReceiptDto[];
    parent: ParentDto;
  } = {
    receipts: [],
    parent: new ParentDto(),
  };
}

export class ParentDto {
  id: string;
  name: string;
  avatar: string;
  email: string;
  phone: string;
  address: string;
}

export class ReceiptDto {
  id: string;
  receipt_number: number;
  title: string;
  student_id: string;
  student_code: string;
  student_name: string;
  office_name: string;
  year: string;
  semester: string;
  note: string;
  total: number;
  exemption: number;
  paid: number;
  transactions: any[] = [];
  status: TuitionStatus;
  tuitionExemptions: TuitionExemption[] = [];
  tuitionRevenues: TuitionRevenue[] = [];
}

export class CreateReceiptDto {
  // student_id: string;
  student_name: string;
  student_code: string;
  class_school: string;
  office_id: string;

  receipt_number: number;
  collection_date: Date;
  trans_id: string;
  paid?: number;
  title?: string;
  pay_by?: string;
}

export class DeleteReceiptDto {
  ids: ReceiptIdDto[];
}

export class ReceiptIdDto {
  id: string;
}

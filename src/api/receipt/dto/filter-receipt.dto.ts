import { PaginationModifyDto } from '@/common/page/pagination-modify.dto';
import { OrderBy, SortBy } from '../../users/dto';

export class FilterReceiptDto extends PaginationModifyDto {
  student_name?: string;
  sort_by?: SortBy;
  order_by?: OrderBy;
}

export class FilterHistoryReceiptDto extends PaginationModifyDto {
  student_id?: string;
  start_date?: Date;
  end_date?: Date;
}

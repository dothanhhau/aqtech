import { PaginationModifyDto } from '@/common/page/pagination-modify.dto';
import { OrderBy, SortBy } from '../../users/dto';
import { TuitionStatus } from '../../../common/enum/tuition_status.enum';

export class FilterTuitionDto extends PaginationModifyDto {
  student_name?: string;
  status?: TuitionStatus;
  sort_by?: SortBy;
  order_by?: OrderBy;
}

export class FilterRevenueDto extends PaginationModifyDto {
  student_id: string;
}

export class FilterExemptionDto extends PaginationModifyDto {
  student_id: string;
}
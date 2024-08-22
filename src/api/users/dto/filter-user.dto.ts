import { PaginationModifyDto } from '@/common/page/pagination-modify.dto';
import { TypeSocial, TypeUser } from '../../../common/enum';

export class FilterUserDto extends PaginationModifyDto {
  sort_by?: SortBy;
  order_by?: OrderBy;
  name?: string;
  role?: TypeUser //= TypeUser.CUSTOMER;
  // department_id?: string;
  // studio_id?: string;
  office_id?: string;
}

export class FilterKOLDto {
  user_id?: string;
  type?: TypeSocial;
}

export class FilterSocial {
  userId?: string;
  type?: TypeSocial;
  access_token?: string;
  refresh_token?: string;
}

export enum SortBy {
  name = 'NAME',
  date = 'DATE',
}

export enum OrderBy {
  asc = 'ASC',
  desc = 'DESC',
}


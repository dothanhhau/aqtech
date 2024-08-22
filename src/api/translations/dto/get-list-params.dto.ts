import { PaginationModifyDto } from '@/common/page/pagination-modify.dto';
import { ApiProperty } from '@nestjs/swagger';

enum SortBy {
  keyword = 'keyword',
  create_date = 'create_date',
  update_date = 'update_date',
}
enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}
export class GetListTranslationParamsDto extends PaginationModifyDto {
  @ApiProperty({
    type: String,
    description: 'Query by keyword or translations',
  })
  query?: string;
  sort_by?: SortBy;
  sort_order?: SortOrder;
}

import { Type } from 'class-transformer';
import { IsOptional, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number = PAGINATION.DEFAULT_PAGE;

  @IsOptional()
  @Type(() => Number)
  @Min(1)
  size?: number = PAGINATION.DEFAULT_SIZE;

  get skip() {
    return (this.page - 1) * this.size;
  }

  get limit() {
    return +this.size;
  }
}

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_SIZE: 50,
};

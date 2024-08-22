import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsDate, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaginationModifyDto } from '@/common/page/pagination-modify.dto';
import { Type } from 'class-transformer';
import { StudentIdDto } from './studentId-dto';

export class SelectedStudentsDto extends PaginationModifyDto {
  @IsArray()
  @ApiProperty()
  student_ids: string[];
}
export class FilterOfficeDto extends PaginationModifyDto {
  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Office ID', type: String })
  office_id?: string;
}

export class FilterRegimeDto extends PaginationModifyDto {
  student_id: string;
}

export class FilterExemptionDto extends PaginationModifyDto {
  student_id: string;
}
export class UpdateStudentDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  full_name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  class_school?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  teacher?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  grade?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  type_revenue?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  gender?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  address?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty()
  birthday?: Date;

  @IsString()
  @IsOptional()
  @ApiProperty()
  avatar?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  full_avatar?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  office_id?: string;
  
  @IsString()
  @IsOptional()
  @ApiProperty()
  regime_id?: string;
}

export class CreateStudentDto {
  @IsString()
  @IsOptional()
  @ApiProperty()
  @IsNotEmpty()
  code?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  full_name?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  class_school?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  teacher?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  grade?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  gender?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  phone?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  address?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @ApiProperty()
  birthday?: Date;

  @IsString()
  @IsOptional()
  @ApiProperty()
  avatar?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  full_avatar?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  office_id?: string;

  @IsString()
  @IsOptional()
  @ApiProperty()
  regime_id?: string;
}

export class DeleteStudentsDto {
  @IsArray()
  @ApiProperty({ type: [StudentIdDto] })
  ids: StudentIdDto[];
}

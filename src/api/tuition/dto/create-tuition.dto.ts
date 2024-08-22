import { ArrayMinSize, IsArray, IsNotEmpty, IsOptional, IsString, IsUrl, ValidateNested } from "class-validator";
import { TypeCustomer } from "../../../common/enum";
import { ErrorCode } from "../../../common/exceptions/error-code.exception";
import { RequestMedias } from "../../media/dto/create-media-file.dto";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

export class ReadFileDto {
  @ApiProperty({ type: 'file', format: 'binary' })
  file: any;

  // @IsString()
  // @IsNotEmpty()
  // office_id: string;
}


export class CreateTuitionRevenueDto {
  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsString()
  @IsNotEmpty()
  revenue_id: string;

  money?: number;

  content?: string;
}

export class CreateExemptionDto {
  @IsString()
  @IsNotEmpty()
  student_id: string;

  @IsString()
  @IsNotEmpty()
  exemption_id: string;

  money?: number;

  content?: string;
}

export class DeleteStudentDto {
  ids: StudentIdDto[];
}

export class StudentIdDto {
  id: string;
}


export class PaymentReminderDto {
  studentIds: StudentIdDto[];
}
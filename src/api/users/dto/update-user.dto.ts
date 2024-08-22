import { StringFilter } from 'aws-sdk/clients/securityhub';
import { IsString, IsArray, IsOptional, IsPhoneNumber, IsNotEmpty, IsEmail, Matches, IsEnum } from 'class-validator';
import { ErrorCode } from '../../../common/exceptions/error-code.exception';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileDto {
  @IsString()
  fullname?: string;

  // @IsString()
  // address?: string;

  birthday?: Date;

  @IsPhoneNumber('VN', { message: ErrorCode.phone_number_is_incorrect })
  phone?: string;

  // @IsString()
  // job?: string;

  // @IsString()
  // gender?: string;

  @IsOptional()
  full_avatar?: string;
}

export class UpdateUserDto {
  // @IsString()
  // @IsNotEmpty()
  // @Matches(/^[a-zA-Z0-9]+$/, { message: ErrorCode.code_must_only_include_letters_and_numbers })
  code?: string;

  @IsString()
  fullname?: string;

  // @IsString()
  // address?: string;

  // birthday?: Date;

  @IsPhoneNumber('VN', { message: ErrorCode.phone_number_is_incorrect })
  phone?: string;

  @IsString()
  @IsEmail()
  email?: string;

  // @IsString()
  // gender?: string;

  @IsOptional()
  full_avatar?: string;

  // @IsString()
  officer_number?: string;

  // @IsString()
  derpartment_name?: string;

  // @IsString()
  office_id?: string;

  // @IsString()
  // department_id?: string;

  // @IsString()
  // studio_id?: string;

  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}


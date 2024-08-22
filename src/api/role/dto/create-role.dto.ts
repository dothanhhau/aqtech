import { IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  description?: string;

  status: boolean;

  priority: number;

  name_display?: string;
}

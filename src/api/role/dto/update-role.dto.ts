import { IsOptional, IsString } from 'class-validator';

export class UpdateRoleDto {
  @IsString()
  name: string;

  @IsOptional()
  description?: string;

  status: boolean;

  @IsOptional()
  priority: number;

  name_display?: string;
}

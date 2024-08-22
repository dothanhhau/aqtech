import { IsOptional, IsString } from 'class-validator';

export class CreatePermissionDto {
  @IsString()
  action: string;

  @IsOptional()
  api_endpoint?: string;

  @IsOptional()
  api_method?: string;

  @IsOptional()
  api_type?: string;

  @IsOptional()
  group_permission?: string;

  @IsOptional()
  show_status?: boolean;
}

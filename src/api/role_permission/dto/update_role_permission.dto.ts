import { PartialType } from '@nestjs/mapped-types';
import { CreateRolePermissionDto } from './create_role_permission.dto';

export class UpdateRolePermissionDto extends PartialType(CreateRolePermissionDto) {}

import { SetMetadata } from '@nestjs/common';
import { TypeUser } from '../enum/type-user.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: TypeUser[]) => SetMetadata(ROLES_KEY, roles);

import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role } from '@/database/entity';
import { Repository } from 'typeorm';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @InjectRepository(Role, 'postgres') private readonly roleRepository: Repository<Role>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.get<boolean>('isPublic', context.getHandler());

    if (isPublic) {
      return true;
    }

    const { user, url, method } = context.switchToHttp().getRequest();
    const userRoles = await this.roleRepository
      .createQueryBuilder('role')
      .leftJoinAndSelect('role.rolePermission', 'role_permission')
      .leftJoinAndSelect('role_permission.permission', 'permission')
      .where('role.name IN (:...roleNames)', { roleNames: user.roleNames })
      .andWhere('permission.api_method = :method', { method })
      .andWhere(`:url LIKE CONCAT('%', permission.api_endpoint, '%')`)
      .andWhere('role_permission.delete = :delete', { delete: false })
      .setParameter('url', url)
      .getMany();

    return userRoles.length > 0;
  }
}

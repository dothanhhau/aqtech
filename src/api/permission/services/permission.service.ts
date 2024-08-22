import { Repository } from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission, RolePermission } from '@/database/entity';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { generatedKey } from '@/common/generatedKey';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { TypeApi, TypeUser } from '@/common/enum';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission, 'postgres') private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(RolePermission, 'postgres') private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto) {
    const existPermission = await this.permissionRepository.findOneBy({
      api_endpoint: createPermissionDto.api_endpoint,
      api_method: createPermissionDto.api_method,
    });
    if (existPermission) {
      throw new HttpException(ErrorCode.permission_already_exists, HttpStatus.NOT_FOUND);
    }

    try {
      const permission = this.permissionRepository.create({
        ...createPermissionDto,
        id: generatedKey.ref(32),
        action: createPermissionDto.action,
        api_endpoint: createPermissionDto.api_endpoint,
        api_method: createPermissionDto.api_method,
        api_type: createPermissionDto.api_type,
        group_permission: createPermissionDto.group_permission,
        show_status: createPermissionDto.show_status,
      });
      await this.permissionRepository.save(permission);

      return permission;
    } catch (error) {
      throw new HttpException(ErrorCode.create_permission_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(): Promise<any[]> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.rolePermissions', 'role_permission')
      .leftJoinAndSelect('role_permission.role', 'role')
      .where({ delete: false, show_status: true })
      .orderBy('permission.group_permission', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .getMany();

    const groupedPermissions: { [groupPermission: string]: any[] } = {};
    permissions.forEach((permission) => {
      if (!groupedPermissions[permission.group_permission]) {
        groupedPermissions[permission.group_permission] = [];
      }

      const roles = permission.rolePermissions
        .filter((rolePermission) => !rolePermission.delete)
        .map((rolePermission) => rolePermission.role.name);

      groupedPermissions[permission.group_permission].push({
        id: permission.id,
        action: permission.action,
        roles: roles,
      });
    });

    const result = Object.keys(groupedPermissions).map((groupPermission) => ({
      group: groupPermission,
      apis: groupedPermissions[groupPermission],
    }));

    return result;
  }

  async getAccessRight(roleNames: string[]): Promise<any> {
    const permissions = await this.permissionRepository
      .createQueryBuilder('permission')
      .leftJoinAndSelect('permission.rolePermissions', 'role_permission')
      .leftJoinAndSelect('role_permission.role', 'role')
      .where({ delete: false })
      .orderBy('permission.group_permission', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .getMany();

    const groupedPermissions: { [groupPermission: string]: any } = {};

    permissions.forEach((permission) => {
      if (!groupedPermissions[permission.group_permission]) {
        groupedPermissions[permission.group_permission] = {};
      }
      const { action, api_type } = permission;

      // Ignore social api if user is not kol
      if (!roleNames.includes(TypeUser.Admin) && api_type === TypeApi.SOCIAL) {
        return;
      }

      const roles = permission.rolePermissions
        .filter((rolePermission) => !rolePermission.delete)
        .map((rolePermission) => rolePermission.role.name);
      const access = roleNames.some((roleName) => roles.includes(roleName)) ? 1 : 0;

      // Ignore if api allow all users
      // const containAllRoles = JSON.stringify(roles.sort()) === JSON.stringify(Object.values(TypeUser).sort());
      // if (containAllRoles) {
      //   return;
      // }

      groupedPermissions[permission.group_permission][action] = access;
    });

    return groupedPermissions;
  }

  async findOne(permissionId: string) {
    const permission = await this.permissionRepository.findOneBy({ id: permissionId });
    if (!permission) {
      throw new HttpException(ErrorCode.permission_not_existed, HttpStatus.NOT_FOUND);
    }

    return permission;
  }

  async update(permissionId: string, updatePermissionDto: UpdatePermissionDto) {
    try {
      const permission = await this.permissionRepository.findOneBy({ id: permissionId });
      if (!permission) {
        throw new HttpException(ErrorCode.permission_not_existed, HttpStatus.NOT_FOUND);
      }
      permission.action = updatePermissionDto.action;
      permission.api_endpoint = updatePermissionDto.api_endpoint || permission.api_endpoint;
      permission.api_method = updatePermissionDto.api_method || permission.api_method;
      permission.api_type = updatePermissionDto.api_type || permission.api_type;
      permission.group_permission = updatePermissionDto.group_permission || permission.group_permission;
      permission.show_status = updatePermissionDto.show_status || permission.show_status;
      await this.permissionRepository.save(permission);

      return permission;
    } catch (error) {
      throw new HttpException(ErrorCode.update_permission_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(permissionId: string) {
    const permission = await this.permissionRepository.findOneBy({ id: permissionId });
    if (!permission) {
      throw new HttpException(ErrorCode.permission_not_existed, HttpStatus.NOT_FOUND);
    }

    const rolePermission = await this.rolePermissionRepository.findBy({ permission_id: permissionId });
    if (rolePermission) {
      await this.rolePermissionRepository.delete({ permission_id: permissionId });
    }

    await this.permissionRepository.delete(permissionId);

    return permission;
  }
}

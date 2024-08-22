import { Repository } from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Permission, Role, RolePermission } from '@/database/entity';
import { CreateRolePermissionDto } from '../dto/create_role_permission.dto';
import { UpdateRolePermissionDto } from '../dto/update_role_permission.dto';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { generatedKey } from '@/common/generatedKey';

@Injectable()
export class RolePermissionService {
  constructor(
    @InjectRepository(RolePermission, 'postgres') private readonly rolePermissionRepository: Repository<RolePermission>,
    @InjectRepository(Permission, 'postgres') private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role, 'postgres') private readonly roleRepository: Repository<Role>,
  ) {}

  async create(createRolePermissionDto: CreateRolePermissionDto) {
    return `Create new`;
  }

  findAll() {
    return `This action returns all rolePermission`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rolePermission`;
  }

  async createOrUpdate(updateDto: UpdateRolePermissionDto) {
    const { role_id, permission_id, status } = updateDto;

    const permission = await this.permissionRepository.findOneBy({ id: permission_id });
    if (!permission) {
      throw new HttpException(ErrorCode.permission_not_existed, HttpStatus.NOT_FOUND);
    }

    const role = await this.roleRepository.findOneBy({ id: role_id });
    if (!role) {
      throw new HttpException(ErrorCode.role_not_existed, HttpStatus.NOT_FOUND);
    }

    let rolePermission = await this.rolePermissionRepository.findOneBy({ role_id, permission_id });
    if (!status) {
      if (rolePermission) {
        await this.rolePermissionRepository.remove(rolePermission);
      }
    } else {
      if (!rolePermission) {
        rolePermission = this.rolePermissionRepository.create({ ...updateDto, id: generatedKey.ref(32) });
      } else {
        rolePermission.delete = false;
      }

      await this.rolePermissionRepository.save(rolePermission);
    }
  }

  remove(id: number) {
    return `This action removes a #${id} rolePermission`;
  }
}

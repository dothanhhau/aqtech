import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '@/database/entity/role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { generatedKey } from '@/common/generatedKey';
import { FilterRoleDto } from '../dto/filter-role.dto';
import { RolePermission, UserRole } from '../../../database/entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role, 'postgres') private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole, 'postgres') private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RolePermission, 'postgres') private readonly rolePermissionRepository: Repository<RolePermission>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const existRole = await this.roleRepository.findOneBy({ name: createRoleDto.name, delete: false });
    if (existRole) {
      throw new HttpException(ErrorCode.role_already_exists, HttpStatus.BAD_REQUEST);
    }

    // restore role
    const existDeletedRole = await this.roleRepository.findOneBy({ name: createRoleDto.name, delete: true });
    if (existDeletedRole) {
      existDeletedRole.status = true;
      existDeletedRole.delete = false;
      await this.roleRepository.save(existDeletedRole);
      return existDeletedRole;
    }

    try {
      const role = this.roleRepository.create({ ...createRoleDto, id: generatedKey.ref(32) });
      await this.roleRepository.save(role);

      return role;
    } catch (error) {
      throw new HttpException(ErrorCode.create_role_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findAll(query: FilterRoleDto): Promise<Role[]> {
    let conditions: any = {};
    conditions = { delete: false };
    return await this.roleRepository.find({ where: conditions, order: { priority: 'ASC' } });
  }

  async findOne(roleId: string) {
    const role = await this.roleRepository.findOneBy({ id: roleId, delete: false });
    if (!role) {
      throw new HttpException(ErrorCode.role_not_existed, HttpStatus.NOT_FOUND);
    }

    return role;
  }

  async update(roleId: string, updateRoleDto: UpdateRoleDto) {
    try {
      const roleExist = await this.roleRepository.findOneBy({ id: roleId, delete: false });
      if (!roleExist) {
        throw new HttpException(ErrorCode.role_not_existed, HttpStatus.NOT_FOUND);
      }
      const role = await this.roleRepository.save({ ...roleExist, ...updateRoleDto });

      return role;
    } catch (error) {
      throw new HttpException(ErrorCode.update_role_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(roleId: string) {
    let role = await this.roleRepository.findOneBy({ id: roleId, delete: false });
    if (!role) {
      throw new HttpException(ErrorCode.role_not_existed, HttpStatus.NOT_FOUND);
    }

    const userRoles = await this.userRoleRepository.findBy({ delete: false, role_id: roleId });
    if (userRoles.length > 0) {
      throw new HttpException(ErrorCode.role_is_being_used, HttpStatus.BAD_REQUEST);
    }

    const rolePermissions = await this.rolePermissionRepository.findBy({ role_id: roleId });
    if (rolePermissions.length > 0) {
      await this.rolePermissionRepository.remove(rolePermissions);
    }

    role.delete = true;
    await this.roleRepository.save(role);

    return role;
  }
}

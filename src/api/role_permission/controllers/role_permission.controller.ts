import { Controller, Get, Post, Body, Param, Delete, UseInterceptors, UseGuards, Put } from '@nestjs/common';
import { RolePermissionService } from '../sevices/role_permission.service';
import { CreateRolePermissionDto } from '../dto/create_role_permission.dto';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { SentryInterceptor } from '@/common/interceptors';
import { RolesGuard } from '@/api/auth/guards/roles.guard';
import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';

@UseInterceptors(SentryInterceptor)
@ApiTags('Role permission')
@Controller('role-permission')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
export class RolePermissionController {
  constructor(private readonly rolePermissionService: RolePermissionService) {}

  @Post()
  create(@Body() createRolePermissionDto: CreateRolePermissionDto) {
    return this.rolePermissionService.create(createRolePermissionDto);
  }

  @Get()
  findAll() {
    return this.rolePermissionService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rolePermissionService.findOne(+id);
  }

  @Put()
  createOrUpdate(@Body() createRolePermissionDto: CreateRolePermissionDto) {
    return this.rolePermissionService.createOrUpdate(createRolePermissionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rolePermissionService.remove(+id);
  }
}

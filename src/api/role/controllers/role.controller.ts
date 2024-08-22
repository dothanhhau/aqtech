import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { SentryInterceptor } from '@/common/interceptors';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { FilterRoleDto } from '../dto/filter-role.dto';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { RolesGuard } from '@/api/auth/guards/roles.guard';

@UseInterceptors(SentryInterceptor)
@ApiTags('Roles')
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiSecurity('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
  create(@Body() createRoleDto: CreateRoleDto) {
    return this.roleService.create(createRoleDto);
  }

  @Get()
  findAll(@Query() query: FilterRoleDto) {
    return this.roleService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roleService.findOne(id);
  }

  @Put(':id')
  @ApiSecurity('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
  update(@Param('id') id: string, @Body() updateLanguageDto: UpdateRoleDto) {
    return this.roleService.update(id, updateLanguageDto);
  }

  @Delete(':id')
  @ApiSecurity('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
  delete(@Param('id') id: string) {
    return this.roleService.delete(id);
  }
}

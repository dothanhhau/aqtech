import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { UseInterceptors, Request } from '@nestjs/common';
import { SentryInterceptor } from '@/common/interceptors';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PermissionService } from '../services/permission.service';
import { CreatePermissionDto } from '../dto/create-permission.dto';
import { UpdatePermissionDto } from '../dto/update-permission.dto';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { RolesGuard } from '@/api/auth/guards/roles.guard';

@UseInterceptors(SentryInterceptor)
@ApiTags('Permissions')
@Controller('permission')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  findAll() {
    return this.permissionService.findAll();
  }

  @Get('access-right')
  accessRight(@Request() req: any) {
    return this.permissionService.getAccessRight(req.user.roleNames);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLanguageDto: UpdatePermissionDto) {
    return this.permissionService.update(id, updateLanguageDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.permissionService.delete(id);
  }
}

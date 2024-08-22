import { HttpRequest } from '@/shared/http/request.interface';
import { Body, Controller, Delete, Get, Param, Post, Put, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsCreatorGuard } from '../../auth/guards/is-creator.guard';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { CreateDeviceDto } from '../dto/create-device.dto';
import { DeviceService } from '../services/device.service';
import { UseInterceptors } from '@nestjs/common';
import { SentryInterceptor } from '@/common/interceptors';

@UseInterceptors(SentryInterceptor)
@ApiTags('Device')
@Controller('device')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard)
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) {}

  @Post()
  create(@Request() req: HttpRequest, @Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(req.user, createDeviceDto);
  }

  @Get(':push_key')
  findOne(@Request() req: HttpRequest, @Param('push_key') pushKey: string) {
    return this.deviceService.findOne(req.user, pushKey);
  }

  @Put(':push_key')
  update(@Request() req: HttpRequest, @Param('push_key') pushKey: string) {
    return this.deviceService.updateDevice(req.user, pushKey);
  }

  @Delete(':push_key')
  delete(@Request() req: HttpRequest, @Param('push_key') pushKey: string) {
    return this.deviceService.delete(req.user, pushKey);
  }
}

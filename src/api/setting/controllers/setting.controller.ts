import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
  Request,
  UploadedFile,
  Res,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { FastifyFileInterceptor, SentryInterceptor } from '@/common/interceptors';
import { ApiBearerAuth, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SettingService } from '../services/setting.service';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { RolesGuard } from '@/api/auth/guards/roles.guard';
import { CreateOfficeDto } from '../dto/create-office.dto';
import { CreateExemptionSettingDto, CreateRegimeDto, CreateRevenueDto } from '../dto/create-exemption.dto';
import { FilterExemptionDto, FilterRevenueDto, SettingDto } from '../dto/fitter-setting.dto';
import { ReadFileDto } from '@/api/tuition/dto/create-tuition.dto';
import { FastifyRequest, FastifyReply} from 'fastify';
import { Response } from 'express'
import { ErrorCode } from '@/common/exceptions/error-code.exception';

@UseInterceptors(SentryInterceptor)
@ApiTags('Settings')
@Controller('setting')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get('system')
  findSystem() {
    return this.settingService.system();
  }

  @Put('system')
  updateSystem(@Body() settingDto: SettingDto) {
    try {
      return this.settingService.updateSetting(settingDto);
    } catch (error) {
      throw new HttpException(ErrorCode.update_exemption_unsuccessfull, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('revenues')
  findAll(@Query() query: FilterRevenueDto) {
    return this.settingService.findRevenues(query);
  }

  @Get('office')
  findOffices() {
    return this.settingService.findOffices();
  }

  @Get('office/detail/:id')
  findOfficesById(@Param('id') id: string) {
    return this.settingService.findOfficeById(id);
  }

  @Post('office')
  createOffice(@Body() createDto: CreateOfficeDto) {
    return this.settingService.createOffice(createDto);
  }

  @Put('office/update/:id')
  updateOffice(@Param('id') officeId: string, @Body() updateDto: CreateOfficeDto) {
    return this.settingService.updateOffice(officeId, updateDto);
  }

  @Delete('office/delete/:id')
  deleteOffice(@Param('id') officeId: string) {
    return this.settingService.deleteOffice(officeId);
  }

  @Get('exemptions')
  findExemptions(@Query() query: FilterExemptionDto) {
    return this.settingService.findExemptions(query);
  }

  @Get('exemption/detail/:id')
  findExmptionById(@Param('id') id: string) {
    return this.settingService.findExemptionById(id);
  }

  @Post('exemption')
  createExemption(@Body() createDto: CreateExemptionSettingDto) {
    return this.settingService.createExemption(createDto);
  }

  @Put('exemption/update/:id')
  updateExemption(@Param('id') exemptionId: string, @Body() updateDto: CreateExemptionSettingDto) {
    return this.settingService.updateExemption(exemptionId, updateDto);
  }

  @Delete('exemption/delete/:id')
  deleteExemption(@Param('id') exemptionId: string) {
    return this.settingService.deleteExemption(exemptionId);
  }

  @Get('revenue-install/:officeId')
  revenueInstall(@Param('officeId') officeId: string) {
    return this.settingService.revenueInstall(officeId);
  }

  @Get('revenue/detail/:id')
  findRevenueById(@Param('id') id: string) {
    return this.settingService.findRevenueById(id);
  }

  @Post('create-revenue')
  createRevenue(@Body() createDto: CreateRevenueDto) {
    return this.settingService.createRevenue(createDto);
  }

  @Put('revenue/update/:id')
  updateRevenue(@Param('id') id: string, @Body() updateDto: CreateRevenueDto) {
    return this.settingService.updateRevenue(id, updateDto);
  }

  @Delete('revenue/delete/:id')
  deleteRevenue(@Param('id') id: string) {
    return this.settingService.deleteRevenue(id);
  }

  @Get('regime/detail/:id')
  findRegimeById(@Param('id') id: string) {
    return this.settingService.findRegimeById(id);
  }

  @Post('create-regime')
  createRegime(@Body() createDto: CreateRegimeDto) {
    return this.settingService.createRegime(createDto);
  }

  @Put('regime/update/:id')
  updateRegime(@Param('id') id: string, @Body() updateDto: CreateRegimeDto) {
    return this.settingService.updateRegime(id, updateDto);
  }

  @Delete('regime/delete/:id')
  deleteRegime(@Param('id') id: string) {
    return this.settingService.deleteRegime(id);
  }

  @Post('import-exemption')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FastifyFileInterceptor('file'))
  async importFile(@Request() req: any, @Body() dto: ReadFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.settingService.importExemption(req, dto, file);
  }

  @Get('export-exemption')
  async exportExemption(@Res() res: Response, @Query() query?: FilterExemptionDto): Promise<void> {
    await this.settingService.exportExemption(res, query);
  }
}

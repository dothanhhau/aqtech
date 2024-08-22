import { HttpRequest } from '@/shared/http/request.interface';
import { Body, Controller, Delete, Get, Param, Post, Put, Query, Request, Res, UploadedFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsCreatorGuard } from '../../auth/guards/is-creator.guard';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { TuitionService } from '../services/tuition.service';
import { UseInterceptors } from '@nestjs/common';
import { FastifyFileInterceptor, SentryInterceptor } from '@/common/interceptors';
import { CreateExemptionDto, CreateTuitionRevenueDto, DeleteStudentDto, PaymentReminderDto, ReadFileDto } from '../dto/create-tuition.dto';
import { FilterExemptionDto, FilterRevenueDto, FilterTuitionDto } from '../dto/filter-tuition.dto';
import { SelectedTuitionsDto } from '../dto/seleted-tuitions-dto';
import { Response } from 'express';

@UseInterceptors(SentryInterceptor)
@ApiTags('Tuition')
@Controller('tuition')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard)
export class TuitionController {
  constructor(private readonly tuitionService: TuitionService) {}

  @Get('list-tuition')
  list(@Query() query: FilterTuitionDto) {
    return this.tuitionService.lists(query);
  }

  @Get('student/:id')
  findOne(@Param('id') studentId: string) {
    return this.tuitionService.findStudent(studentId);
  }

  @Delete('student-delete')
  removeStudent(@Body() deleteDto: DeleteStudentDto) {
    return this.tuitionService.removeStudents(deleteDto);
  }

  @Get('list-revenue')
  listRevenue(@Query() query: FilterRevenueDto) {
    return this.tuitionService.revenues(query);
  }
  
  @Post('create-revenue')
  createRevenue(@Body() createDto: CreateTuitionRevenueDto) {
    return this.tuitionService.createRevenue(createDto);
  }

  @Delete('delete-revenue/:id')
  removeRevenue(@Param('id') id: string) {
    return this.tuitionService.removeRevenue(id);
  }

  @Get('list-exemption')
  listExemption(@Query() query: FilterExemptionDto) {
    return this.tuitionService.exemptions(query);
  }
  
  @Post('create-exemption')
  createExemption(@Body() createDto: CreateExemptionDto) {
    return this.tuitionService.createExemption(createDto);
  }

  @Delete('delete-exemption/:id')
  removeExemption(@Param('id') id: string) {
    return this.tuitionService.removeExemption(id);
  }

  @Post('payment-reminder')
  paymentReminder(@Body() paymentReminderDto: PaymentReminderDto) {
    return this.tuitionService.paymentReminder(paymentReminderDto);
  }

  @Post('read')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FastifyFileInterceptor('file'))
  @ApiOperation({ summary: 'Import Data' })
  readFile(@Request() req: any, @Body() dto: ReadFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.tuitionService.saveFile(req, dto, file);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export Data' })
  async exportTuitions(@Body() selectedTuitionsDto: SelectedTuitionsDto, @Res() res: any) {
    const { dataBuffer, templateBuffer } = await this.tuitionService.exportTuitions(selectedTuitionsDto);

    if (selectedTuitionsDto.tuition_ids.length === 0) {
      res.header('Content-Disposition', 'attachment; filename=HOC_PHI_TEMPLATE.xlsx');
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(templateBuffer);
    } else {
      res.header('Content-Disposition', 'attachment; filename=DANH_SACH_HOC_PHI.xlsx');
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.send(dataBuffer);
    }
  }

  @Get('export-tuition')
  async exportTuition(@Res() res: Response) {
    const buf = await this.tuitionService.exportTuition();
    res.header('Content-Disposition', 'attachment; filename=HOC_PHI.xlsx');
    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  }
}

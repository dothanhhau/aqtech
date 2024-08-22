import { Controller, Get, Param, Query, Res, UseGuards, Request, Post, Delete, Body, Put } from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsCreatorGuard } from '../../auth/guards/is-creator.guard';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { UseInterceptors } from '@nestjs/common';
import { SentryInterceptor } from '@/common/interceptors';
import { ReceiptService } from '../services/receipt.service';
import { FilterHistoryReceiptDto, FilterReceiptDto } from '../dto/filter-receipt.dto';
import { Response } from 'express';
import { CreateReceiptDto, DeleteReceiptDto } from '../dto/create-receipt.dto';
import { UsersService } from '@/api/users/services/users.service';

@UseInterceptors(SentryInterceptor)
@ApiTags('Receipt')
@Controller('receipt')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard)
export class ReceiptController {
  constructor(private readonly receiptService: ReceiptService, private readonly userService: UsersService) {}

  @Get('list-receipt')
  list(@Query() query: FilterReceiptDto) {
    return this.receiptService.lists(query);
  }

  @Get('receipt/:id')
  findOne(@Param('id') receiptId: string) {
    return this.receiptService.findReceipt(receiptId);
  }

  @Post('create-receipt')
  async createReceipt(@Request() req, @Body() createDto: CreateReceiptDto) {
    const user = await this.userService.findByUserName(req.user.username);
    return this.receiptService.createReceipt(createDto, user);
  }

  @Put('update-receipt/:id')
  updateReceipt(@Param('id') id: string, @Body() updateDto: CreateReceiptDto) {
    return this.receiptService.updateReceipt(id, updateDto);
  }

  @Delete('delete-receipt')
  removeStudents(@Body() deleteDto: DeleteReceiptDto) {
    return this.receiptService.removeReceipts(deleteDto);
  }

  @Get('history-receipt')
  historyReceipt(@Request() req: any, @Query() query: FilterHistoryReceiptDto) {
    return this.receiptService.historyReceipt(req, query);
  }

  @Get('print-receipt/:receipt_id')
  async printReceipt(@Param('receipt_id') receiptId: string, @Res() res: Response) {
    const { filename, fileBuffer } = await this.receiptService.printReceipt(receiptId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', fileBuffer.length.toString());

    res.send(fileBuffer);
  }

  @Get('print-total-tuition/:student_id')
  async printTotalTuition(@Param('student_id') studentId: string, @Res() res: Response) {
    const { filename, fileBuffer } = await this.receiptService.totalTuition(studentId);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    res.setHeader('Content-Length', fileBuffer.length.toString());

    res.send(fileBuffer);
  }
}

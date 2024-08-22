import { Controller, Body, UseInterceptors, Post, Get, HttpException, HttpStatus, Logger, Query, UseGuards, Request } from '@nestjs/common';
import { PaymentService } from '../services/payment.service';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { SentryInterceptor } from '@/common/interceptors';
import { CreateBillRequestDto } from '../dto/create-bill-request.dto';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { EduReceiptDto } from '../dto/edu-receipt.dto';
import { EduBillBill } from '@/database/entity';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { UsersService } from '@/api/users/services/users.service';
import { ApiKeyGuard } from '../guards/api-key.guard';

@UseInterceptors(SentryInterceptor)
@ApiTags('Payments')
@Controller('edubill')
export class EduBillController {
  private readonly logger: Logger;

  constructor(private readonly paymentService: PaymentService, private readonly userService: UsersService) {
    this.logger = new Logger(EduBillController.name);
  }

  @ApiSecurity('JWT-auth')
  @ApiBearerAuth()
  @UseGuards(JwtAccessGuard)
  @Post('create-bill')
  async createBill(@Request() req, @Body() createBillRequest: CreateBillRequestDto) {
    try {
      const user = await this.userService.findByUserName(req.user.username);
      const paymentURL = await this.paymentService.createBill(createBillRequest, user);

      if (!paymentURL) {
        throw new HttpException(ErrorCode.payment_unsuccessful, HttpStatus.BAD_REQUEST);
      }

      return {
        data: {
          paymentURL: paymentURL,
        },
      };
    } catch (error: any) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(ApiKeyGuard)
  @Get('w-dongbophieuthuedubill')
  async getEduReceipt(@Query('MaSV') student_code: string) {
    const transaction = await this.paymentService.getTransactionByStudentCode(student_code);

    if (!transaction || transaction.length == 0) {
      throw new HttpException(ErrorCode.student_not_existed, HttpStatus.BAD_REQUEST);
    }
    const phieu_thu: EduBillBill[] = [];
    transaction.forEach((receipt) => {
      phieu_thu.push(...receipt.phieu_thu);
    });
    return {
      code: HttpStatus.OK,
      message: 'success',
      ten_sv: transaction[0].ten_sv,
      tien_toi_thieu: transaction[0].tien_toi_thieu,
      is_nhap_tien: transaction[0].is_nhap_tien,
      phieu_thu: phieu_thu.map((receipt) => {
        return {
          stt: receipt.stt,
          hoc_ky: receipt.hoc_ky,
          so_phieu_bao: receipt.so_phieu_bao,
          id_phieu_bao: receipt.id_phieu_bao,
          hoc_ky_chu: receipt.hoc_ky_chu,
          noi_dung: receipt.noi_dung,
          chi_tiet: receipt.chi_tiet,
          trang_thai: receipt.trang_thai,
          ma_loai_thu: receipt.ma_loai_thu,
          phai_thu: receipt.phai_thu,
          tong_thu: receipt.tong_thu,
          mien_giam: receipt.mien_giam,
          ngay_tao: receipt.ngay_tao,
          kenh_thu: receipt.kenh_thu,
          is_bat_buoc_thanh_toan_het: receipt.is_bat_buoc_thanh_toan_het,
        };
      }),
    };
  }

  @UseGuards(ApiKeyGuard)
  @Post('w-gachnoedubill')
  async syncEduReceipt(@Body() eduReceipt: EduReceiptDto) {
    this.logger.debug('[w-gachnoedubill]:', eduReceipt);
    try {
      await this.paymentService.syncEduReceipt(eduReceipt);
      return {
        code: HttpStatus.OK,
        message: 'Gạch nợ thành công',
      };
    } catch (e) {
      console.log(e);
      return {
        code: HttpStatus.BAD_REQUEST,
        message: 'Gạch nợ không thành công',
      };
    }
  }
}

import { SentryInterceptor } from '@/common/interceptors';
import { UseInterceptors, Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiSecurity, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { BillFilter } from '../dto/bill-filter.dto';
import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';

@UseInterceptors(SentryInterceptor)
@ApiTags('Payments')
@Controller('payments')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('bills')
  async getBills(@Request() req: any, @Query() query?: BillFilter) {
    return this.paymentService.getReceipts(req.user.username, query);
  }
}

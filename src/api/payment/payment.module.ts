import { Module } from '@nestjs/common';
import { PaymentService } from './services/payment.service';
import { EduBillController } from './controllers/edubill.controller';
import { DatabaseModule } from '@/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EduBillBill, EduBillTransaction, Student } from '@/database/entity';
import { UsersService } from '../users/services/users.service';
import { TuitionService } from '../tuition/services/tuition.service';
import { Receipt } from '@/database/entity/receipt.entity';
import { SettingService } from '../setting/services/setting.service';
import { ReceiptService } from './services/receipt.service';
import { PaymentController } from './controllers/payment.controller';
import { StudentService } from '../users/services/student.service';

@Module({
  imports: [
    DatabaseModule.UserSharedOrmModule,
    TypeOrmModule.forFeature([EduBillBill, EduBillTransaction, Receipt, Student], 'postgres'),
  ],
  providers: [PaymentService, UsersService, TuitionService, SettingService, ReceiptService, StudentService],
  controllers: [EduBillController, PaymentController],
})
export class PaymentModule {}

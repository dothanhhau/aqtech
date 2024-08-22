import { Global, Module } from '@nestjs/common';
import { SMSClient } from '../common/client_services/sms-client';
import { ExcelHelper } from './excel';
import { GenerateEntityHelper } from './generate-entity';
import { ImageHelper } from './image';
import { InitData } from '../common/create-data/init-data';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Permission, RolePermission } from '@/database/entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Permission], 'postgres'), TypeOrmModule.forFeature([RolePermission], 'postgres')],
  providers: [ImageHelper, ExcelHelper, GenerateEntityHelper, SMSClient, InitData],
  exports: [ImageHelper, ExcelHelper, GenerateEntityHelper, SMSClient, InitData],
})
export class SharedModule {}

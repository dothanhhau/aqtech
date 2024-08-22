import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseService } from './database.service';
import { PostgreSqlConfig } from './postgresql.config';
import {
  Permission,
  Role,
  RolePermission,
  User,
  UserRole,
  UserVerification,
  Device,
  Language,
  UserLanguage,
  Media,
  Tuition,
  Student,
  Office,
  Revenue,
  Regime,
  StudentUser,
  TuitionRevenue,
  TuitionExemption,
  Exemption,
  Setting,
  EduBillBill,
  EduBillTransaction,
  Receipt,
} from './entity';
import { Dictionary } from './entity/dictionary.entity';
import { DictionaryKeywords } from './entity/dictionary_keyword.entity';

@Module({
  imports: [TypeOrmModule.forRootAsync({ name: 'postgres', useClass: PostgreSqlConfig })],
  providers: [DatabaseService],
})
export class DatabaseModule {
  static get UserSharedOrmModule() {
    return TypeOrmModule.forFeature(
      [
        User,
        Permission,
        Role,
        UserRole,
        RolePermission,
        UserVerification,
        Device,
        Language,
        Dictionary,
        DictionaryKeywords,
        UserLanguage,
        Media,
        Tuition,
        Student,
        Office,
        Revenue,
        Exemption,
        Regime,
        StudentUser,
        StudentUser,
        TuitionRevenue,
        TuitionExemption,
        Setting,
        EduBillBill,
        EduBillTransaction,
        Receipt,
      ],
      'postgres',
    );
  }
}

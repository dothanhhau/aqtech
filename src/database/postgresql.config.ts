import { Environments } from '@/common/enum';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';

@Injectable()
export class PostgreSqlConfig implements TypeOrmOptionsFactory {
  constructor(private config: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    const nodeEnv: Environments = this.config.get('NODE_ENV');
    // Setting synchronize: true shouldn't be used in production,
    // otherwise you can lose production data.
    const shouldSync: boolean = ![Environments.Prod].includes(nodeEnv);

    return {
      type: 'postgres',
      host: this.config.get('POSTGRES_HOST'),
      port: this.config.get('POSTGRES_PORT'),
      username: this.config.get('POSTGRES_USERNAME'),
      password: this.config.get('POSTGRES_PASSWORD'),
      database: this.config.get('POSTGRES_DATABASE'),
      synchronize: shouldSync,
      cache: true,
      entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    };
  }
}

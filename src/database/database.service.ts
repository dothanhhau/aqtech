import { Environments } from '@/common/enum';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { execSync } from 'child_process';
import dayjs from 'dayjs';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class DatabaseService {
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private config: ConfigService) {}

  get workdir() {
    const rawdir: string = this.config.get('PG_DUMP_DIR');
    const osuser: string = this.config.get('USER');
    return rawdir.replace('~', '/home/' + osuser);
  }

  get db_name() {
    return this.config.get('POSTGRES_DATABASE');
  }

  get db_username() {
    return this.config.get('POSTGRES_USERNAME');
  }

  get file_path() {
    const day = dayjs();
    const now = day.format('YYYY_MM_DD_') + day.valueOf();
    return `${this.workdir}/${this.db_name}.${now}.tar`;
  }

  /**
   * Auto backup database every day at 2AM UTC
   *
   * To restore backup file, execute follow command:
   * *pg_restore -U {db_username} -ce --if-exists -d {db_name} {file_path}*
   */
  @Cron(CronExpression.EVERY_DAY_AT_7PM)
  autoBackup() {
    const nodeEnv: Environments = this.config.get('NODE_ENV');
    if (nodeEnv !== Environments.Prod) {
      return;
    }

    // Check for dir, if not found create it using the mkdir
    if (!existsSync(this.workdir)) {
      mkdirSync(this.workdir);
    }
    execSync(`pg_dump -U ${this.db_username} -d ${this.db_name} -f ${this.file_path} -F t`);
  }

  /**
   * Auto remove backup file older than 30 days
   */
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT)
  autoRemove() {
    if (existsSync(this.workdir)) {
      execSync(`find ${this.workdir} -name "*.tar" -type f -mtime +30 -delete`);
    }
  }
}

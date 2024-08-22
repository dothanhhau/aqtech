import fs from 'fs';
import path from 'path';

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ExcelHelper {
  private DEFAULT_FILES_DIR_EXCEL = path.join(__dirname, '../../../file_excel');
  private readonly logger: Logger;

  constructor(private config: ConfigService) {
    this.logger = new Logger(ExcelHelper.name);
  }

  /**
   * Save Excel file to local storage
   * @param fileName
   * @param file
   * @returns
   */
  async saveExcel(fileName: string, file: Express.Multer.File) {
    const filesPath = this.DEFAULT_FILES_DIR_EXCEL;
    const filePath = path.join(filesPath, fileName);

    const dirPath = path.join(filesPath);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    fs.writeFileSync(filePath, file.buffer);

    return filePath;
  }
}

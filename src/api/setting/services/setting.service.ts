import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exemption, Office, Regime, Revenue, Setting, Student } from '../../../database/entity';
import { CreateOfficeDto } from '../dto/create-office.dto';
import { CreateExemptionSettingDto, CreateRegimeDto, CreateRevenueDto } from '../dto/create-exemption.dto';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { generatedKey } from '@/common/generatedKey';
import httpStatus from 'http-status';
import { FilterExemptionDto, FilterRevenueDto, SettingDto } from '../dto/fitter-setting.dto';
import { removeAccents } from '../../../shared/utility';
import * as ExcelJS from 'exceljs';
import { ConfigService } from '@nestjs/config';
import { ReadFileDto } from '@/api/tuition/dto/create-tuition.dto';
import { Response } from 'express';
import { Workbook } from 'exceljs';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Student, 'postgres') private readonly studentRepository: Repository<Student>,
    @InjectRepository(Setting, 'postgres') private readonly settingRepository: Repository<Setting>,
    @InjectRepository(Office, 'postgres') private readonly officeRepository: Repository<Office>,
    @InjectRepository(Revenue, 'postgres') private readonly revenueRepository: Repository<Revenue>,
    @InjectRepository(Regime, 'postgres') private readonly regimeRepository: Repository<Regime>,
    @InjectRepository(Exemption, 'postgres') private readonly exemptionRepository: Repository<Exemption>,
    private config: ConfigService,
  ) {}
  readonly xlsx = /\.(xlsx)$/;
  private readonly XLSX_UPLOAD_LIMIT = 5 * 1024 * 1024;
  async system() {
    const offices = await this.officeRepository.find({ where: { delete: false } });
    const setting = await this.settingRepository.createQueryBuilder('setting').where({ delete: false }).getOne();
    return { ...setting, offices };
  }

  async updateSetting(settingDto: SettingDto) {
    let setting = await this.settingRepository.findOne({ where: { delete: false } });
    setting = await this.settingRepository.save({ ...setting, ...settingDto });
    return setting;
  }

  async findRevenues(query: FilterRevenueDto) {
    const queryBuilder = this.revenueRepository
      .createQueryBuilder('revenue')
      .leftJoinAndSelect('revenue.regimes', 'regime', 'regime.delete = :del', { del: false })
      .where({ delete: false })
      .orderBy('revenue.create_date', 'DESC');

    if (query.regime_name) {
      queryBuilder.andWhere('regime.name = :nameRegime', { nameRegime: query.regime_name });
    }

    if (query.office_id) {
      queryBuilder.andWhere('revenue.office_id = :office_id', { office_id: query.office_id });
    }

    if (query.type_revenue) {
      queryBuilder.andWhere('revenue.type_revenue = :type_revenue', { type_revenue: query.type_revenue });
    }

    if (query.code) {
      queryBuilder.andWhere('revenue.code = :code', { code: query.code });
    }

    if (query.name) {
      const normalizedQueryName = removeAccents(query.name);
      queryBuilder.andWhere('LOWER(revenue.name) LIKE LOWER(:name)', { name: `%${normalizedQueryName}%` });
    }
    const revenues = await queryBuilder.getMany();
    return revenues;
  }

  async findOffices() {
    return await this.officeRepository.find({
      where: { delete: false },
      order: { create_date: 'DESC' },
    });
  }

  async findOfficeByName(name: string) {
    const office = await this.officeRepository
      .createQueryBuilder('office')
      .where({ delete: false })
      .andWhere('LOWER(office.name) = LOWER(:name)', { name })
      .getOne();

    return office;
  }

  async findOfficeById(id: string) {
    const office = await this.officeRepository.findOneBy({ id, delete: false });
    if (!office) {
      throw new HttpException(ErrorCode.office_not_existed, HttpStatus.NOT_FOUND);
    }
    return office;
  }

  async createOffice(createDto: CreateOfficeDto) {
    const office = await this.findOfficeByName(createDto.name);
    if (office) {
      throw new HttpException(ErrorCode.office_name_already_exists, HttpStatus.BAD_REQUEST);
    }

    try {
      const newOffice = this.officeRepository.create({
        ...createDto,
        id: generatedKey.ref(32),
      });

      await this.officeRepository.save(newOffice);
      return newOffice;
    } catch (error) {
      throw new HttpException(ErrorCode.create_office_unsuccessfull, httpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateOffice(officeId: string, updateDto: CreateOfficeDto) {
    const office = await this.findOfficeById(officeId);

    if (!office) {
      throw new HttpException(ErrorCode.office_not_existed, HttpStatus.NOT_FOUND);
    }

    if (updateDto.name) {
      const checkName = await this.findOfficeByName(updateDto.name);
      if (checkName && officeId !== checkName.id) {
        throw new HttpException(ErrorCode.office_name_already_exists, HttpStatus.BAD_REQUEST);
      }
    }

    try {
      const updateOffice = await this.officeRepository.save({ ...office, ...updateDto });
      return updateOffice;
    } catch (error) {
      throw new HttpException(ErrorCode.update_office_unsuccessfull, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteOffice(officeId: string) {
    let office = await this.findOfficeById(officeId);
    if (!office) {
      throw new HttpException(ErrorCode.office_not_existed, HttpStatus.NOT_FOUND);
    }

    try {
      office.delete = true;
      office = await this.officeRepository.save(office);
      return office;
    } catch (error) {
      throw new HttpException(ErrorCode.delete_office_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findExemptions(query: FilterExemptionDto) {
    const queryBuilder = this.exemptionRepository
      .createQueryBuilder('exemption')
      .leftJoinAndSelect('exemption.office', 'office', 'office.delete = :del', { del: false })
      .leftJoinAndSelect('exemption.regime', 'regime', 'regime.delete = :del', { del: false })
      .where({ delete: false })
      .orderBy({ 'exemption.create_date': 'DESC' });
    if (query.office_id) {
      queryBuilder.andWhere('exemption.office_id = :office_id', { office_id: query.office_id });
    }

    if (query.code) {
      queryBuilder.andWhere('exemption.code = :code', { code: query.code });
    }

    if (query.name) {
      const normalizedQueryName = removeAccents(query.name);
      queryBuilder.andWhere('LOWER(unaccent(exemption.name)) LIKE LOWER(:name)', { name: `%${normalizedQueryName}%` });
    }
    const exemptions = await queryBuilder.getMany();
    return exemptions;
  }

  async findExemptionByCode(code: string, officeId: string) {
    const exemption = await this.exemptionRepository
      .createQueryBuilder('exemption')
      .leftJoinAndSelect('exemption.office', 'office', 'office.delete = :del', { del: false })
      .where({ delete: false })
      .andWhere('LOWER(unaccent(exemption.code)) = LOWER(unaccent(:code))', { code })
      .andWhere('office_id = :officeId', { officeId })
      .getOne();

    return exemption;
  }

  async findExemptionById(id: string) {
    const exemption = await this.exemptionRepository
      .createQueryBuilder('exemption')
      .leftJoinAndSelect('exemption.office', 'office', 'office.delete = :del', { del: false })
      .where({ id: id, delete: false })
      .getOne();
    if (!exemption) {
      throw new HttpException(ErrorCode.exemption_not_existed, HttpStatus.NOT_FOUND);
    }
    return exemption;
  }

  async createExemption(createDto: CreateExemptionSettingDto) {
    const exemption = await this.findExemptionByCode(createDto?.code, createDto.office_id);

    if (exemption) {
      throw new HttpException(ErrorCode.exemption_code_already_exists, HttpStatus.BAD_REQUEST);
    }

    let regime = null;
    if (createDto?.regime_id) {
      regime = await this.regimeRepository.findOneBy({ id: createDto.regime_id, delete: false });
    }
    const office = await this.officeRepository.findOneBy({ id: createDto?.office_id, delete: false });

    try {
      const exemptionId = generatedKey.ref(32);
      let newExemption = this.exemptionRepository.create({
        ...createDto,
        id: exemptionId,
        regime,
        office: office,
      });
      newExemption = await this.exemptionRepository.save(newExemption);

      return newExemption;
    } catch (error) {
      throw new HttpException(ErrorCode.create_exemption_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateExemption(exemptionId: string, updateDto: CreateExemptionSettingDto) {
    const exemption = await this.findExemptionById(exemptionId);

    if (!exemption) {
      throw new HttpException(ErrorCode.exemption_not_existed, HttpStatus.NOT_FOUND);
    }

    if (updateDto.code) {
      const checkCode = await this.findExemptionByCode(updateDto.code, updateDto.office_id);
      if (checkCode && exemptionId !== checkCode.id) {
        throw new HttpException(ErrorCode.exemption_code_already_exists, HttpStatus.BAD_REQUEST);
      }
    }

    try {
      let regime = null;
      if (updateDto?.regime_id) {
        regime = await this.regimeRepository.findOneBy({ id: updateDto.regime_id, delete: false });
      }
      const office = await this.officeRepository.findOneBy({ id: updateDto?.office_id, delete: false });

      const updateExemption = await this.exemptionRepository.save({
        ...exemption,
        ...updateDto,
        regime,
        office,
      });
      return updateExemption;
    } catch (error) {
      throw new HttpException(ErrorCode.update_exemption_unsuccessfull, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteExemption(exemptionId: string) {
    const exemption = await this.findExemptionById(exemptionId);

    if (!exemption) {
      throw new HttpException(ErrorCode.exemption_not_existed, HttpStatus.NOT_FOUND);
    }

    try {
      exemption.delete = true;
      await this.exemptionRepository.save(exemption);
      return exemption;
    } catch (error) {
      throw new HttpException(ErrorCode.delete_exemption_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async revenueInstall(office_id: string) {
    const typeRevenue = await this.revenueRepository
      .createQueryBuilder('revenue')
      .select(['type_revenue', 'create_date'])
      .distinctOn(['type_revenue'])
      .where('delete = :delete', { delete: false })
      .andWhere('office_id = :office_id', { office_id: office_id })
      .orderBy('type_revenue, create_date', 'ASC')
      .getRawMany();

    if (!typeRevenue || typeRevenue.length == 0) {
      return [];
    }

    const response = await Promise.all(
      typeRevenue.map(async (typeRev) => {
        const queryBuilderDatas = await this.revenueRepository
          .createQueryBuilder('revenue')
          .leftJoinAndSelect('revenue.regimes', 'regime', 'regime.delete = :del', { del: false })
          .where({ delete: false, office_id: office_id, type_revenue: typeRev.type_revenue })
          .orderBy({ 'revenue.create_date': 'ASC' })
          .getMany();

        if (queryBuilderDatas.length === 0) {
          return { type_revenue: typeRev.type_revenue };
        }

        const revenues = queryBuilderDatas.map((e) => ({
          id: e.id,
          code: e.code,
          name: e.name,
          regimes: e.regimes.map((f) => ({
            id: f.id,
            name: f.name,
            money: f.money,
          })),
        }));

        return { type_revenue: typeRev.type_revenue, revenues };
      }),
    );

    return response;
  }

  async findRevenueById(id: string) {
    const data = await this.revenueRepository.findOneBy({ id, delete: false });

    if (!data) {
      throw new HttpException(ErrorCode.revenue_not_existed, HttpStatus.NOT_FOUND);
    }

    return data;
  }

  async createRevenue(createDto: CreateRevenueDto) {
    const data = await this.revenueRepository.findOneBy({
      delete: false,
      code: createDto.code,
      type_revenue: createDto.type_revenue,
    });

    if (data) {
      throw new HttpException(ErrorCode.revenue_code_already_exists, HttpStatus.BAD_REQUEST);
    }

    try {
      const id = generatedKey.ref(32);
      const dataNew = this.revenueRepository.create({
        ...createDto,
        id: id,
      });
      await this.revenueRepository.save(dataNew);

      return dataNew;
    } catch (error) {
      throw new HttpException(ErrorCode.create_revenue_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateRevenue(id: string, updateDto: CreateRevenueDto) {
    const data = await this.findRevenueById(id);

    if (updateDto.code) {
      const checkCodeExited = await this.revenueRepository
        .createQueryBuilder('revenue')
        .where('revenue.id != :id', { id })
        .andWhere('revenue.code = :code', { code: updateDto.code })
        .andWhere('revenue.type_revenue = :type_revenue', { type_revenue: updateDto.type_revenue })
        .andWhere('revenue.delete = :delete', { delete: false })
        .getOne();

      if (checkCodeExited) {
        throw new HttpException(ErrorCode.revenue_code_already_exists, HttpStatus.BAD_REQUEST);
      }
    }

    try {
      const update = await this.revenueRepository.save({ ...data, ...updateDto });
      return update;
    } catch (error) {
      throw new HttpException(ErrorCode.update_exemption_unsuccessfull, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteRevenue(id: string) {
    let data = await this.findRevenueById(id);

    if (!data) {
      throw new HttpException(ErrorCode.revenue_not_existed, HttpStatus.NOT_FOUND);
    }

    try {
      data.delete = true;
      data = await this.revenueRepository.save(data);
      return data;
    } catch (error) {
      throw new HttpException(ErrorCode.delete_revenue_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findRegimeById(id: string) {
    const data = await this.regimeRepository.findOneBy({ id, delete: false });

    if (!data) {
      throw new HttpException(ErrorCode.regime_not_existed, HttpStatus.NOT_FOUND);
    }

    return data;
  }

  async createRegime(createDto: CreateRegimeDto) {
    const data = await this.regimeRepository.findOneBy({
      name: createDto.name,
      revenue_id: createDto.revenue_id,
      delete: false,
    });

    if (data) {
      throw new HttpException(ErrorCode.regime_name_already_exists, HttpStatus.BAD_REQUEST);
    }

    try {
      const id = generatedKey.ref(32);
      const dataNew = this.regimeRepository.create({
        ...createDto,
        id: id,
      });
      await this.regimeRepository.save(dataNew);

      return dataNew;
    } catch (error) {
      throw new HttpException(ErrorCode.create_regime_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateRegime(id: string, updateDto: CreateRegimeDto) {
    const data = await this.findRegimeById(id);

    if (updateDto.name) {
      const checkCodeExited = await this.regimeRepository
        .createQueryBuilder('regime')
        .where('regime.id != :id', { id })
        .andWhere('regime.name = :name', { name: updateDto.name })
        .andWhere('regime.revenue_id = :revenue_id', { revenue_id: updateDto.revenue_id })
        .andWhere('regime.delete = :delete', { delete: false })
        .getOne();

      if (checkCodeExited) {
        throw new HttpException(ErrorCode.revenue_code_already_exists, HttpStatus.BAD_REQUEST);
      }
    }

    try {
      const update = await this.regimeRepository.save({ ...data, ...updateDto });
      return update;
    } catch (error) {
      throw new HttpException(ErrorCode.update_regime_unsuccessfull, HttpStatus.BAD_REQUEST);
    }
  }

  async deleteRegime(id: string) {
    let data = await this.findRegimeById(id);

    if (!data) {
      throw new HttpException(ErrorCode.regime_not_existed, HttpStatus.NOT_FOUND);
    }

    try {
      data.delete = true;
      data = await this.regimeRepository.save(data);
      return data;
    } catch (error) {
      throw new HttpException(ErrorCode.delete_regime_unsuccessfull, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async importExemption(req: any, readFileDto: ReadFileDto, file: Express.Multer.File) {
    const fileBuffer = file.buffer;
    const fileName = file.originalname;
    this.validateFile(fileBuffer, fileName);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer);
    const worksheet = workbook.worksheets[0];
    this.validateColumns(worksheet);

    const filterDto: FilterExemptionDto = {};
    const existingExemptions = await this.findExemptions(filterDto);
    const existingCodesMap = new Map(existingExemptions.map((ex) => [ex.code?.toLowerCase() || '', ex]));

    const invalidMoneyRows: number[] = [];
    const invalidCodes: string[] = [];
    const duplicateCodes: string[] = [];
    const incompleteRows: number[] = [];
    const newExemptions = [];
    let hasErrors = false;
    const invalidCodePattern = /[^a-zA-Z0-9]/;
    const seenCodes = new Set<string>();
    const codesToInsert = new Set<string>();

    for (let rowIndex = 2; rowIndex <= worksheet.rowCount; rowIndex++) {
      const row = worksheet.getRow(rowIndex);
      if (!row.hasValues) {
        continue;
      }
      let [, , , , money] = row.values as (number | string)[];
      const [, , name, code] = row.values as string[];
      money = money ?? 0;

      if (!name || !code || money === undefined || money === null || name.trim() === null || code.trim() === null) {
        incompleteRows.push(rowIndex);
        hasErrors = true;
        continue;
      }

      // Validate money
      if (money == null || isNaN(Number(money))) {
        invalidMoneyRows.push(rowIndex);
        hasErrors = true;
        continue;
      }

      // Validate code
      const codeLower = code.trim().toLowerCase().toString();
      if (invalidCodePattern.test(codeLower)) {
        invalidCodes.push(code.trim());
        hasErrors = true;
        continue;
      }

      // Check for duplicate code in sheet excel
      if (seenCodes.has(codeLower) || codesToInsert.has(codeLower)) {
        duplicateCodes.push(code.trim());
        hasErrors = true;
        continue;
      }
      seenCodes.add(codeLower);
      codesToInsert.add(codeLower);

      const existingExemption = existingCodesMap.get(codeLower);
      if (!existingExemption) {
        newExemptions.push({
          id: generatedKey.ref(32),
          name: name.trim(),
          code: code.trim(),
          money: money,
          create_by: req.user?.userId,
          update_by: req.user?.userId,
        });
      }
    }

    if (hasErrors) {
      if (incompleteRows.length > 0) {
        console.log(`Incomplete rows: ${incompleteRows.join(', ')}`);
      }
      if (invalidMoneyRows.length > 0) {
        console.log(`Invalid money rows: ${invalidMoneyRows.join(', ')}`);
      }
      if (invalidCodes.length > 0) {
        console.log(`Invalid codes: ${invalidCodes.join(', ')}`);
      }
      if (duplicateCodes.length > 0) {
        console.log(`Duplicate codes: ${duplicateCodes.join(', ')}`);
      }
      throw new HttpException(ErrorCode.invalid_data, HttpStatus.BAD_REQUEST);
    }

    try {
      if (newExemptions.length > 0) {
        await this.exemptionRepository.save(newExemptions);
        console.log(`Saved ${newExemptions.length} new exemptions.`);
      }
    } catch (error) {
      if (error instanceof HttpException) {
        console.log('error.message: ', error.message);
        throw new HttpException(ErrorCode.data_export_failed, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }

  private validateFile(fileBuffer: Buffer, fileName: string) {
    const fileSizeLimit = this.XLSX_UPLOAD_LIMIT;

    if (fileBuffer.length > fileSizeLimit) {
      console.log(`File size exceeds limit: ${fileBuffer.length} bytes`);
      throw new HttpException(ErrorCode.file_too_large, HttpStatus.BAD_REQUEST);
    }

    const lowName = fileName.toLowerCase();
    if (!lowName.endsWith('.xlsx')) {
      console.log(`Invalid file extension: ${fileName}`);
      throw new HttpException(ErrorCode.file_format_is_invalid, HttpStatus.BAD_REQUEST);
    }

    const magicNumber = fileBuffer.toString('hex', 0, 4);
    if (magicNumber !== '504b0304') {
      console.log(`Invalid file format: ${magicNumber}`);
      throw new HttpException(ErrorCode.file_format_is_invalid, HttpStatus.BAD_REQUEST);
    }
  }

  private validateColumns(worksheet: ExcelJS.Worksheet) {
    const expectedHeaders = [
      this.config.get('EXEMPTION_NUMERICAL_ORDER'),
      this.config.get('EXEMPTION_NAME'),
      this.config.get('EXEMPTION_CODE'),
      this.config.get('EXEMPTION_AMOUNT'),
    ];

    const headerRow = worksheet.getRow(1);

    expectedHeaders.reduce((isValid, header, index) => {
      if (headerRow.getCell(index + 1).value !== header) {
        console.log(
          `Header mismatch at index ${index + 1}: Expected '${header}', found '${headerRow.getCell(index + 1).value}'`,
        );
        throw new HttpException(ErrorCode.upload_file_not_success, HttpStatus.BAD_REQUEST);
      }
      return isValid;
    }, true);
  }

  async exportExemption(res: Response, query: FilterExemptionDto): Promise<void> {
    try {
      const exemptions = await this.findExemptions(query);
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet();

      worksheet.columns = [
        { header: this.config.get('EXEMPTION_NUMERICAL_ORDER'), key: 'stt', width: 10 },
        { header: this.config.get('EXEMPTION_NAME'), key: 'name', width: 30 },
        { header: this.config.get('EXEMPTION_CODE'), key: 'code', width: 20 },
        { header: this.config.get('EXEMPTION_AMOUNT'), key: 'money', width: 15, style: { numFmt: '#,##0' } },
      ];

      this.styleHeaderRow(worksheet);

      exemptions.forEach((exemption, index) => {
        worksheet.addRow({
          stt: index + 1,
          name: exemption.name,
          code: exemption.code,
          money: exemption.money,
        });
      });

      this.styleSheet(worksheet);

      const buffer = await workbook.xlsx.writeBuffer();
      const date = new Date();

      const formattedDateTime = `${String(date.getDate()).padStart(2, '0')}${String(date.getMonth() + 1).padStart(
        2,
        '0',
      )}${date.getFullYear()}`;
      const fileName = `${this.config.get('EXEMPTION_EXPORT_FILENAME')}_${formattedDateTime}.xlsx`;

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
      res.send(buffer);
    } catch (error) {
      console.error('Error in export method:', error);
      throw new HttpException(ErrorCode.data_export_failed, HttpStatus.BAD_REQUEST);
    }
  }

  private styleHeaderRow(sheet: any): void {
    const headerRow = sheet.getRow(1);
    headerRow.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '096DD9' } };
      cell.font = { color: { argb: 'FFFFFF' }, bold: true };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  }

  private styleSheet(sheet: any): void {
    sheet.columns.forEach((column) => {
      column.alignment = { horizontal: 'left', vertical: 'middle' };
    });
    sheet.getColumn('stt').alignment = { horizontal: 'center' };
    sheet.getColumn('money').eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber > 1) {
        cell.alignment = { horizontal: 'right', vertical: 'middle' };
      }
    });
  }
}

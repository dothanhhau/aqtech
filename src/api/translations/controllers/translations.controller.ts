import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  Query,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Res,
} from '@nestjs/common';
import { TranslationsService } from '../services/translations.service';
import { CreateTranslationDto } from '../dto/create-translation.dto';
import { UpdateTranslationDto } from '../dto/update-translation.dto';
import { FastifyFileInterceptor, SentryInterceptor } from '@/common/interceptors';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { RolesGuard } from '@/api/auth/guards/roles.guard';
import { GetListTranslationParamsDto } from '../dto/get-list-params.dto';
import { diskStorage } from 'multer';
import { Response } from 'express';
import { CreateKeywordDto } from '../dto/create-keyword.dto';
import { Public } from '@/common/decorators/public.decorator';

@UseInterceptors(SentryInterceptor)
@ApiTags('Translations')
@Controller('translations')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
export class TranslationsController {
  constructor(private readonly translationsService: TranslationsService) {}

  @Get()
  @Public()
  list(@Query() params: GetListTranslationParamsDto) {
    return this.translationsService.list(params);
  }
  // @Get(':id')
  // byId(@Param('id') id: string) {
  //   return this.translationsService.byId(id);
  // }
  @Post()
  create(@Body() createKeywordDto: CreateKeywordDto) {
    return this.translationsService.create(createKeywordDto);
  }
  @Put(':id')
  update(@Param('id') id: string, @Body() updateKeywordDto: CreateKeywordDto) {
    return this.translationsService.update(id, updateKeywordDto);
  }
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.translationsService.delete(id);
  }

  @Post(':id/translate')
  createTranslate(@Param('id') id: string, @Body() createTranslationDto: CreateTranslationDto) {
    return this.translationsService.createTranslate(id, createTranslationDto);
  }
  @Put(':id/translate/:translateId')
  updateTranslate(
    @Param('id') id: string,
    @Param('translateId') translateId: string,
    @Body() updateTranslationDto: UpdateTranslationDto,
  ) {
    return this.translationsService.updateTranslate(id, translateId, updateTranslationDto);
  }

  @Get('export')
  export(@Res() res: Response) {
    return this.translationsService.export(res);
  }

  @Post('import')
  @UseInterceptors(
    FastifyFileInterceptor('file', {
      storage: diskStorage({
        filename: (_request, file, callback) => callback(null, `${new Date().getTime()}-${file.originalname}`),
      }),
    }),
  )
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiConsumes('multipart/form-data')
  import(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
          new FileTypeValidator({
            fileType: 'text/csv',
          }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.translationsService.import(file);
  }

  @Get('resource/:languageId')
  @Public()
  resource(@Param('languageId') languageId: string) {
    return this.translationsService.resource(languageId);
  }
}

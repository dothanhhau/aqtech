import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { generatedKey } from '@/common/generatedKey';
import { HttpException, HttpStatus, Injectable, Res } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTranslationDto } from '../dto/create-translation.dto';
import { UpdateTranslationDto } from '../dto/update-translation.dto';
import { Dictionary } from '@/database/entity/dictionary.entity';
import { DictionaryKeywords } from '@/database/entity/dictionary_keyword.entity';
import { Language } from '@/database/entity/language.entity';
import { GetListTranslationParamsDto } from '../dto/get-list-params.dto';
import { ILike } from 'typeorm';
import { paginate } from '@/shared/utility';
import * as fs from 'fs';
import Papa from 'papaparse';
import { Response } from 'express';
import { CreateKeywordDto } from '../dto/create-keyword.dto';

@Injectable()
export class TranslationsService {
  constructor(
    @InjectRepository(Language, 'postgres')
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(Dictionary, 'postgres')
    private readonly dictionaryRepository: Repository<Dictionary>,
    @InjectRepository(DictionaryKeywords, 'postgres')
    private readonly dictionaryKeywordsRepository: Repository<DictionaryKeywords>,
  ) {}

  async list(params: GetListTranslationParamsDto) {
    let items = await this.dictionaryKeywordsRepository.find({
      relations: {
        translations: {
          language: true,
        },
      },
      where: params.query
        ? [{ keyword: ILike(`%${params.query}%`) }, { translations: { translation: ILike(`%${params.query}%`) } }]
        : [],
      order:
        params.sort_order && params.sort_by
          ? {
              [params.sort_by]: params.sort_order,
            }
          : {
              keyword: 'asc',
            },
    });

    // to get all translations in each keyword
    if (params.query) {
      items = await Promise.all(
        items.map((x) =>
          this.dictionaryKeywordsRepository.findOne({
            where: { id: x.id },
            relations: {
              translations: {
                language: true,
              },
            },
          }),
        ),
      );
    }

    const paginated = paginate(items, params.skip, params.limit);
    return {
      data: paginated.items,
      skip: params.skip,
      limit: params.limit,
      number: paginated.items.length,
      total: items.length,
    };
  }

  // async byId(translationId: string) {
  //   const translation = await this.dictionaryRepository.findOne({
  //     where: { id: translationId },
  //     relations: {
  //       language: true,
  //       keyword: true,
  //     },
  //   });
  //   if (!translation) {
  //     throw new HttpException(ErrorCode.translation_not_existed, HttpStatus.NOT_FOUND);
  //   }
  //
  //   return translation;
  // }

  async create(createKeywordDto: CreateKeywordDto) {
    try {
      let keyword = await this.dictionaryKeywordsRepository.findOne({
        where: { keyword: createKeywordDto.keyword },
      });
      if (keyword) {
        throw new HttpException(ErrorCode.keyword_already_exists, HttpStatus.NOT_FOUND);
      }
      keyword = this.dictionaryKeywordsRepository.create({
        id: generatedKey.ref(32),
        ...createKeywordDto,
      });
      await this.dictionaryKeywordsRepository.save(keyword);
    } catch (error) {
      throw new HttpException(ErrorCode.keyword_creating_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: string, updateKeywordDto: Partial<CreateKeywordDto>) {
    try {
      const keyword = await this.dictionaryKeywordsRepository.findOneBy({ id: id });
      if (!keyword) {
        throw new HttpException(ErrorCode.keyword_not_existed, HttpStatus.NOT_FOUND);
      }
      return await this.dictionaryKeywordsRepository.save({ ...keyword, ...updateKeywordDto });
    } catch (error) {
      throw new HttpException(ErrorCode.keyword_updating_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(id: string) {
    const keyword = await this.dictionaryKeywordsRepository.findOneBy({ id: id });
    if (!keyword) {
      throw new HttpException(ErrorCode.keyword_not_existed, HttpStatus.NOT_FOUND);
    }
    await this.dictionaryKeywordsRepository.delete(id);

    return keyword;
  }

  async createTranslate(id: string, createTranslationDto: CreateTranslationDto) {
    try {
      const language = await this.languageRepository.findOneBy({ id: createTranslationDto.language_id });
      if (!language) {
        throw new HttpException(ErrorCode.language_not_existed, HttpStatus.NOT_FOUND);
      }
      const keyword = await this.dictionaryKeywordsRepository.findOne({
        where: { id },
      });
      if (!keyword) {
        throw new HttpException(ErrorCode.keyword_not_existed, HttpStatus.NOT_FOUND);
      }
      const translation = await this.dictionaryRepository.findOne({
        where: { keyword: keyword, language: language, translation: createTranslationDto.translation },
      });
      if (translation) {
        throw new HttpException(ErrorCode.translation_already_exists, HttpStatus.NOT_FOUND);
      }

      return await this.dictionaryRepository.save({
        ...createTranslationDto,
        id: generatedKey.ref(32),
        language,
        keyword,
      });
    } catch (error) {
      throw new HttpException(ErrorCode.translation_creating_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateTranslate(_keywordId: string, translationId: string, updateTranslationDto: UpdateTranslationDto) {
    try {
      const translation = await this.dictionaryRepository.findOne({
        where: { id: translationId },
      });
      if (!translation) {
        throw new HttpException(ErrorCode.translation_not_existed, HttpStatus.NOT_FOUND);
      }
      const language = await this.languageRepository.findOneBy({ id: updateTranslationDto.language_id });
      if (!language) {
        throw new HttpException(ErrorCode.language_not_existed, HttpStatus.NOT_FOUND);
      }
      return await this.dictionaryRepository.save({ ...translation, ...updateTranslationDto });
    } catch (error) {
      throw new HttpException(ErrorCode.translation_updating_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deleteTranslate(translationId: string) {
    const translation = await this.dictionaryRepository.findOneBy({ id: translationId });
    if (!translation) {
      throw new HttpException(ErrorCode.translation_not_existed, HttpStatus.NOT_FOUND);
    }
    await this.dictionaryRepository.delete(translationId);

    return translation;
  }

  async export(@Res() res: Response) {
    const languages = await this.languageRepository.find({ where: { enable: true } });
    const keywords = await this.dictionaryKeywordsRepository.find({
      relations: {
        translations: {
          language: true,
        },
      },
      order: {
        keyword: 'asc',
      },
    });

    const fields = ['keyword', ...languages.map((x) => x.code)];
    const data = [];
    keywords.forEach((x) => {
      const k = {};
      k['keyword'] = x.keyword;
      languages.forEach((l) => {
        k[l.code] = x.translations.find((t) => t.language.code === l.code)?.translation || '';
      });
      data.push(k);
    });
    const csv = Papa.unparse(
      {
        fields,
        data,
      },
      {
        header: true,
      },
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=translations.csv');

    res.status(200).send(csv);
  }

  async import(file: Express.Multer.File) {
    // 1. Remove all keywords
    await this.dictionaryKeywordsRepository.delete({});

    const languages = [];
    Papa.parse<{ keyword: string; [key: string]: string }>(
      fs.readFileSync(file.path, { encoding: 'utf8', flag: 'r' }),
      {
        header: true,
        step: async (results) => {
          if (results.errors.length > 0) {
            return;
          }
          // 2. Create a new keyword
          const keyword = this.dictionaryKeywordsRepository.create({
            id: generatedKey.ref(32),
            keyword: results.data.keyword,
          });
          await this.dictionaryKeywordsRepository.save(keyword);
          // 3. Add translations
          await Promise.all(
            Object.entries(results.data).map(async ([key, value], index) => {
              if (key === 'keyword') return;

              let language = await this.languageRepository.findOneBy({ code: key });
              if (!language) {
                language = this.languageRepository.create({ id: generatedKey.ref(32), code: key, language: key });
              }
              if (index === 0) {
                languages.push(language);
              }

              return await this.dictionaryRepository.save({
                id: generatedKey.ref(32),
                language,
                keyword,
                translation: value,
              });
            }),
          );
        },
        complete: () => {
          fs.unlinkSync(file.path);
        },
      },
    );

    return {
      success: true,
    };
  }

  async resource(languageId: string) {
    const items = await this.dictionaryKeywordsRepository.find({
      relations: {
        translations: {
          language: true,
        },
      },
      where: { translations: { language: { id: languageId } } },
    });
    const data = {};
    items.forEach((x) => {
      if (x.translations.length > 0) {
        data[x.keyword] = x.translations[0].translation;
      }
    });
    return {
      success: true,
      data,
    };
  }
}

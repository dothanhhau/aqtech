import { ErrorCode } from '@/common/exceptions/error-code.exception';
import { generatedKey } from '@/common/generatedKey';
import { Language, UserLanguage } from '@/database/entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLanguageDto } from '../dto/create-language.dto';
import { UpdateLanguageDto } from '../dto/update-language.dto';
import { UpdateLanguageStatusDto } from '../dto/update-language-status.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LanguageService {
  constructor(
    @InjectRepository(Language, 'postgres') private readonly languageRepository: Repository<Language>,
    @InjectRepository(UserLanguage, 'postgres') private readonly userLanguageRepository: Repository<UserLanguage>,
    private config: ConfigService,
  ) {}

  async create(createLanguageDto: CreateLanguageDto) {
    let language = await this.languageRepository.findOneBy({ language: createLanguageDto.language });
    if (language && !language.delete) {
      throw new HttpException(ErrorCode.language_already_exists, HttpStatus.BAD_REQUEST);
    } else if (language && language.delete) {
      language.delete = false;
      await this.languageRepository.save(language);
    } else {
      try {
        language = this.languageRepository.create({ ...createLanguageDto, id: generatedKey.ref(32) });
        await this.languageRepository.save(language);
      } catch (error) {
        throw new HttpException(ErrorCode.create_language_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }

    return language;
  }

  async findAll() {
    return await this.languageRepository.find({ where: { delete: false }, order: { language: 'ASC' } });
  }

  async findOne(languageId: string) {
    const language = await this.languageRepository.findOneBy({ id: languageId, delete: false });
    if (!language) {
      throw new HttpException(ErrorCode.language_not_existed, HttpStatus.NOT_FOUND);
    }

    return language;
  }

  async update(languageId: string, updateLanguageDto: UpdateLanguageDto) {
    try {
      const language = await this.languageRepository.findOneBy({ id: languageId, delete: false });
      if (!language) {
        throw new HttpException(ErrorCode.language_not_existed, HttpStatus.NOT_FOUND);
      }
      const lang = await this.languageRepository.save({ ...language, ...updateLanguageDto });

      return lang;
    } catch (error) {
      throw new HttpException(ErrorCode.update_language_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateStatus(languageId: string, updateLanguageStatusDto: UpdateLanguageStatusDto) {
    try {
      const language = await this.languageRepository.findOneBy({ id: languageId, delete: false });
      if (!language) {
        throw new HttpException(ErrorCode.language_not_existed, HttpStatus.NOT_FOUND);
      }
      const lang = await this.languageRepository.save({ ...language, ...updateLanguageStatusDto });

      return lang;
    } catch (error) {
      throw new HttpException(ErrorCode.update_language_unsuccessful, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(languageId: string) {
    const language = await this.languageRepository.findOneBy({ id: languageId, delete: false });
    if (!language) {
      throw new HttpException(ErrorCode.language_not_existed, HttpStatus.NOT_FOUND);
    }

    // not delete default language
    if (language.language == this.config.get('DEFAULT_LANGUAGE')) {
      throw new HttpException(ErrorCode.do_not_delete_default_language, HttpStatus.NOT_FOUND);
    }

    // update user using default language
    const defaultLanguage = await this.languageRepository.findOneBy({
      language: this.config.get('DEFAULT_LANGUAGE'),
      delete: false,
    });

    const userLanguages = await this.userLanguageRepository.findBy({
      language_id: languageId,
      delete: false,
    });

    for (let userLanguage of userLanguages) {
      userLanguage.language_id = defaultLanguage.id;
      await this.userLanguageRepository.save(userLanguage);
    }

    // const users = await this.userRepository
    //   .createQueryBuilder('users')
    //   .leftJoinAndSelect('users.userLanguages', 'user_language', 'user_language.delete = :del', { del: false })
    //   .where({ delete: false })
    //   .andWhere('user_language.language_id = :languageId', { languageId: languageId })
    //   .getMany();
    // if (users.length > 0) {
    //   throw new HttpException(ErrorCode.language_is_being_used, HttpStatus.BAD_REQUEST);
    // }

    language.delete = true;
    await this.languageRepository.save(language);

    return language;
  }
}

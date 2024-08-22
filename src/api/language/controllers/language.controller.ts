import { Controller, Get, Post, Put, Body, Param, Delete, UseInterceptors, UseGuards } from '@nestjs/common';
import { LanguageService } from '../services/language.service';
import { CreateLanguageDto } from '../dto/create-language.dto';
import { UpdateLanguageDto } from '../dto/update-language.dto';
import { SentryInterceptor } from '@/common/interceptors';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { RolesGuard } from '@/api/auth/guards/roles.guard';
import { UpdateLanguageStatusDto } from '../dto/update-language-status.dto';
import { Public } from '@/common/decorators/public.decorator';

@UseInterceptors(SentryInterceptor)
@ApiTags('Languages')
@Controller('language')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
export class LanguageController {
  constructor(private readonly languageService: LanguageService) {}

  @Post()
  create(@Body() createLanguageDto: CreateLanguageDto) {
    return this.languageService.create(createLanguageDto);
  }

  @Get()
  @Public()
  async findAll() {
    const data = await this.languageService.findAll();
    // await Promise.all(
    //   data
    //     // .filter((x) => !x.flag)
    //     .map(async (x, index) => {
    //       const lang = await axios.get<{ flags: { svg: string } }[]>(
    //         'https://restcountries.com/v3.1/lang/' + x.language.toLowerCase(),
    //       );
    //       if (!x.flag) {
    //         const res = await this.languageService.update(x.id, { ...x, flag: lang.data[0].flags.svg });
    //         data[index] = res;
    //       }
    //     }),
    // );
    return data;
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.languageService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLanguageDto: UpdateLanguageDto) {
    return this.languageService.update(id, updateLanguageDto);
  }

  @Put('update-status/:id')
  updateStatus(@Param('id') id: string, @Body() updateLanguageStatusDto: UpdateLanguageStatusDto) {
    return this.languageService.updateStatus(id, updateLanguageStatusDto);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.languageService.delete(id);
  }
}

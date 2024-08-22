import { IsCreatorGuard } from '@/api/auth/guards/is-creator.guard';
import { JwtAccessGuard } from '@/api/auth/guards/jwt-access.guard';
import { HttpRequest } from '@/shared/http/request.interface';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiSecurity, ApiTags } from '@nestjs/swagger';
import {
  ChangePasswordRequest,
  FilterUserDto,
  ActiveUserDto,
  CreateNewUser,
  FilterKOLDto,
  ResetPassWord,
} from '../dto';
import { UsersService } from '../services/users.service';
import { UseInterceptors, Query, Res, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator } from '@nestjs/common';
import { FastifyFileInterceptor, SentryInterceptor } from '@/common/interceptors';
import { RolesGuard } from '@/api/auth/guards/roles.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UpdateLanguageRequest } from '../dto/update-language-user.dto';
import { UpdateUserSocialDto } from '../../auth/dto/register.dto';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'fastify-multer';
import { UpdateProfileDto, UpdateUserDto } from '../dto/update-user.dto';
import { ReadFileDto } from '../dto/import-user.dto';

@UseInterceptors(SentryInterceptor)
@ApiTags('Users')
@Controller('users')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard, RolesGuard)
export class UsersController {
  constructor(private userService: UsersService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Request() req: any, @Body() request: CreateNewUser) {
    return this.userService.create(req.user, request);
  }

  @Get('me')
  // @UseInterceptors(MapInterceptor(User, ResponseUser))
  // @ApiOkResponse({ type: ResponseUser })
  // @ApiOkResponse({ schema: { anyOf: refs(ResponseUser) } })
  get(@Request() req: any) {
    return this.userService.getMe(req.user.userId, req.user.username);
  }

  @Get('network')
  getNetwork(@Request() req: any) {
    return this.userService.getMe(req.user.userId, req.user.username);
  }

  @Get('detail/:id')
  getDetail(@Param('id') id: string) {
    return this.userService.getUserDetail(id);
  }

  @Put('update-profile')
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.userService.updateProfile(req.user.userId, dto);
  }

  @Put('update-user/:id')
  updateUser(@Param('id') id: string, @Request() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(id, req.user, dto);
  }

  @Put('active/:id')
  activeUser(@Param('id') id: string, @Request() req: HttpRequest, @Body() dto: ActiveUserDto) {
    return this.userService.active(id, req.user, dto);
  }

  @Put('change-password')
  changePassword(@Request() req: HttpRequest, @Body() dto: ChangePasswordRequest) {
    return this.userService.changePassword(req.user, dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPassWord) {
    return this.userService.resetPassword(dto);
  }

  @Put('update-language/:id')
  updateLanguage(@Param('id') id: string, @Body() dto: UpdateLanguageRequest) {
    return this.userService.updateLanguage(id, dto);
  }

  @Get('lists')
  list(@Query() query: FilterUserDto) {
    return this.userService.lists(query);
  }

  @Delete('delete-user/:id')
  deleteUser(@Param('id') userId: string, @Request() req: HttpRequest) {
    return this.userService.deleteUser(userId, req.user);
  }

  // @Get('user-social')
  // getSocial(@Request() req: HttpRequest, @Query() query: FilterKOLDto) {
  //   return this.socialService.getSocialByUserId(req.user, query); // -> refresh data
  // }

  // @Put('update-user-social')
  // updateUserSocial(@Request() req, @Body() body: UpdateUserSocialDto) {
  //   return this.socialService.updateUserSocial(req.user, body);
  // }

  // @Delete('delete-social')
  // deleteSocial(@Request() req, @Body() body: UpdateUserSocialDto) {
  //   return this.socialService.deleteSocial(req, body);
  // }

  // @Put('up-info-KOL')
  // updateSocial(@Body() dto: UpdateSocial) {
  //   return this.socialService.UpdateSocial(dto);
  // }

  // @Post('ref-info-KOL')
  // RefSocial(@Query() query: FilterKOLDto) {
  //   return this.socialService.getSocial(query);
  // }

  // @Post('video')
  // @ApiConsumes('multipart/form-data')
  // @ApiOperation({ summary: 'upload video on s3' })
  // @UseInterceptors(FastifyFileInterceptor('file'))
  // uploadVideo(@Body() dto: UploadVideoDto, @UploadedFile() file: Express.Multer.File) {
  //   return this.userService.uploadVideo(dto, file);
  // }

  // @Get('report')
  // report(@Request() req: any, @Query() query: FilterReportDto) {
  //   return this.userService.report(query);
  // }

  // @Get('report-kol-detail/:id')
  // reportKOLDetail(@Param('id') id: string) {
  //   return this.userService.reportKOLDetail(id);
  // }

  @Get('export-data')
  async exportUsers(@Res() res: Response, @Query() query?: FilterUserDto): Promise<void> {
    await this.userService.exportUsers(res, query);
  }

  @Post('import')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FastifyFileInterceptor('file'))
  @ApiOperation({ summary: 'Import Data' })
  async import(@Body() dto: ReadFileDto, @UploadedFile() file: Express.Multer.File) {
    try {
      await this.userService.import(file);
    } catch (error) {
      console.error('Error in import method:', error);
    }
  }
}

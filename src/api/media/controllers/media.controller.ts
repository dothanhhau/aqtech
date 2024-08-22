import { FastifyFileInterceptor } from '@/common/interceptors';
import { Body, Controller, Delete, Param, Post, UploadedFile, UploadedFiles, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { IsCreatorGuard } from '../../auth/guards/is-creator.guard';
import { JwtAccessGuard } from '../../auth/guards/jwt-access.guard';
import { CreateMediaFileDto } from '../dto/create-media-file.dto';
import { MediaService } from '../services/media.service';
import { UseInterceptors } from '@nestjs/common';
import { SentryInterceptor } from '@/common/interceptors';

@UseInterceptors(SentryInterceptor)
@ApiTags('Media')
@Controller('media')
@ApiSecurity('JWT-auth')
@ApiBearerAuth()
@UseGuards(JwtAccessGuard, IsCreatorGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}
  
  @Post('create-file')
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FastifyFileInterceptor('file'))
  createFile(@Body() dto: CreateMediaFileDto, @UploadedFile() file: Express.Multer.File) {
    return this.mediaService.createFile(file);
  }

  @Delete(':url')
  deleteFile(@Param('url') url: string) {
    return this.mediaService.deleteFile(url);
  }
}

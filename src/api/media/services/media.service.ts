import { FolderName, ImageSize } from '@/common/enum';
import { ImageHelper } from '@/shared/image';
import { addTimestampToFileName } from '@/shared/utility';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';

@Injectable()
export class MediaService {
  private readonly logger: Logger;
  // private readonly server_ip: 'http://103.7.41.133:3015/';

  constructor(private imageHelper: ImageHelper) {
    this.logger = new Logger(MediaService.name);
  }

  async createFile(file: Express.Multer.File, folder = FolderName.DEFAULT) {
    const fileName = addTimestampToFileName(file.originalname);
    const result = await this.imageHelper.saveFile({
      file: file,
      fileName: fileName,
      folderName: folder,
    });
    if (result.length === 0) {
      throw new BadRequestException();
    } else {
      let path = result[0].Location;
      this.logger.log(`File uploaded successfully at ${path}`);

      return this.imageHelper.parseS3Result(result, file.originalname);
    }
  }

  async deleteFile(url_full: string) {
    try {
      // console.log("url_full: " + url_full)
      const result = await this.imageHelper.deleteImage({
        fullUrl: url_full,
      });

      if (result.Deleted.length === 0) {
        throw new BadRequestException();
      } else {
        this.logger.log(`File ${url_full} deleted successfully!`);
      }
    } catch (error) {
      console.log('error: ' + error);
    }
  }

  getSmallImage(url: string) {
    return this.imageHelper.getVariant(url, ImageSize.SM);
  }

  getMediumImage(url: string) {
    return this.imageHelper.getVariant(url, ImageSize.MD);
  }

  getLargeImage(url: string) {
    return this.imageHelper.getVariant(url, ImageSize.LG);
  }
}

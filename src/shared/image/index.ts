import AWS from 'aws-sdk';
import sharp from 'sharp';

import { FolderName, ImageSize } from '@/common/enum';
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ObjectIdentifierList } from 'aws-sdk/clients/s3';
import { getMagicNumber, getNthOccurrence as indexOfNthSplash } from '../utility';
import {
  DeleteImageParams,
  SaveFileParams,
  SaveImageParams,
  SaveVideoParams,
  SendData,
  UploadResult,
} from './interfaces';
import { ErrorCode } from '@/common/exceptions/error-code.exception';
import * as fs from 'fs';
import * as path from 'path';
const url = require('url');

@Injectable()
export class ImageHelper {
  private readonly logger: Logger;
  private readonly s3: AWS.S3;
  // private readonly baseURL = 'http://103.7.41.133:3015';
  private readonly baseURL = 'https://media-influencer.payroller.vn';
  readonly variantSizes = [0, 1024, 512, 256];
  readonly variantKeys = ['original', 'large', 'medium', 'small'];
  readonly allowRex = /\.(jpg|jpeg|png|pdf|xls|xlsx|ppt|docx|mp4|mov|avi|mkv|wmv)$/;
  readonly imgs = /\.(jpg|jpeg|png)$/;
  readonly videos = /\.(mp4|mov|avi|mkv|wmv)$/;

  constructor(private config: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: config.get('AWS_S3_ACCESS_KEY'),
      secretAccessKey: config.get('AWS_S3_SECRET_KEY'),
    });
    this.logger = new Logger(ImageHelper.name);
  }

  /**
   * Delete image from a S3 bucket
   * @param params
   * @returns Delete object output
   */
  async deleteImage(params: DeleteImageParams) {
    const typeStore = this.config.get('UPLOAD_FILE_TO');
    switch (typeStore) {
      case '1': // local
        const pathParts = params.fullUrl.split('/');
        const path = '/var/www/html/' + pathParts.slice(pathParts.indexOf('media')).join('/');
        //console.log("path: " + path)
        try {
          await fs.promises.unlink(path);
          return { Deleted: [params.fullUrl] };
        } catch (err) {
          //console.error(err);
          return { Deleted: [] };
        }

      case '2': // s3
        const objects: ObjectIdentifierList = this.variantSizes.map(function (size) {
          let key = params.fullUrl.slice(indexOfNthSplash(params.fullUrl, 3) + 1);
          if (size) {
            const sid = key.indexOf('/') + 1;
            key = key.substring(0, sid) + size + '/' + key.substring(sid);
          }
          return { Key: key };
        });
        return this.s3
          .deleteObjects({
            Bucket: this.config.get('AWS_S3_BUCKET'),
            Delete: { Objects: objects },
          })
          .promise();

      default:
        break;
    }
  }

  /**
   * Upload image to a server.
   * Supported formats are JPEG, PNG, WEBP, GIF.
   * Except SVG input which becomes PNG output.
   * @param params
   * @returns Managed upload output
   */
  async saveFile(params: SaveFileParams) {
    let tasks: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    this.validateFile(params);
    const typeStore = this.config.get('UPLOAD_FILE_TO');

    switch (typeStore) {
      case '1': // local
        let files: SendData[] = [];

        for (const size of this.variantSizes) {
          //const folderPath = path.join(process.cwd(), params.folderName, size ? size.toString() : '');
          let folderPath = path.join('/var/www/html/', params.folderName, size ? size.toString() : '');
          let dataBuffer = params.file.buffer;

          if (size != 0 && !this.isImage(params)) {
            break;
          }

          if (size != 0 && this.isImage(params)) {
            dataBuffer = await sharp(dataBuffer).resize(size).withMetadata().toBuffer();
          }

          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
          }

          let filePath = path.join(folderPath, params.fileName);
          fs.writeFileSync(filePath, dataBuffer);

          const sizeImg = size ? '/' + size.toString() : '';
          filePath = this.baseURL + `/${params.folderName}${sizeImg}/${params.fileName}`;
          // console.log(filePath)
          files.push({ Location: filePath });
        }
        return Promise.all(files);

      case '2': // s3
        for (const size of this.variantSizes) {
          let dataBuffer = params.file.buffer;
          if (size != 0 && !this.isImage(params)) {
            break;
          }

          if (size != 0 && this.isImage(params)) {
            dataBuffer = await sharp(dataBuffer).resize(size).withMetadata().toBuffer();
          }

          const dataKey = params.folderName
            .concat('/')
            .concat(size ? size + '/' : '')
            .concat(params.fileName);

          tasks.push(
            this.s3
              .upload({
                Bucket: this.config.get('AWS_S3_BUCKET'),
                ContentType: params.file.mimetype,
                Key: dataKey,
                Body: dataBuffer,
                ACL: 'public-read',
              })
              .promise(),
          );
        }
        return Promise.all(tasks);
    }
  }

  /**
   * Ensure image and video valid to upload
   * @param params
   * @returns
   */
  validateFile(params: SaveFileParams) {
    const file = params.file;

    // Check maximum size for image and video
    if (
      (this.isImage(params) && file.size > parseInt(this.config.get('IMAGE_UPLOAD_LIMIT'))) ||
      (this.isVideo(params) && file.size > parseInt(this.config.get('VIDEO_UPLOAD_LIMIT')))
    ) {
      throw new HttpException(ErrorCode.file_too_large, HttpStatus.BAD_REQUEST);
    }
    // Check format by name
    const lowname = file.originalname.toLowerCase();
    if (!lowname.match(this.allowRex)) {
      throw new HttpException(ErrorCode.file_format_is_invalid, HttpStatus.BAD_REQUEST);
    }

    // Check format by signature
    const magicNumber = getMagicNumber(file.buffer);
    if (
      !(
        (
          magicNumber.startsWith('FFD8') || // JPE, JPEG, JPG
          magicNumber.startsWith('89504E47') || // PNG
          magicNumber.startsWith('25504446') || // PDF
          magicNumber.startsWith('504B0304') || // XLSX
          magicNumber.startsWith('D0CF11E0') || // XLS
          magicNumber.startsWith('D0CF11E0') || // DOC
          magicNumber.startsWith('504B0304') || // PPTX
          magicNumber.startsWith('00000020') || // MP4
          magicNumber.startsWith('00000014') || // MOV
          magicNumber.startsWith('52494646') || // AVI
          magicNumber.startsWith('1A45DFA3') || // MKV
          magicNumber.startsWith('3026B275')
        ) // WMV
      )
    ) {
      throw new HttpException(ErrorCode.file_format_is_invalid, HttpStatus.BAD_REQUEST);
    }

    return;
  }

  /**
   * Get folder name from full URL
   * @param url
   * @returns
   */
  getFolderName(url: string) {
    const start = indexOfNthSplash(url, 3);
    const end = url.lastIndexOf('/');
    return url.substring(start + 1, end);
  }

  /**
   * Get variant URL from full URL
   * @param url
   * @param size
   * @param folder
   * @returns
   */
  getVariant(url: string, size: ImageSize, folder?: FolderName | string) {
    if (!folder) {
      folder = this.getFolderName(url);
    }
    return url.replace(folder, folder + '/' + size.toString());
  }

  /**
   * Parse S3 uploaded result to list of full URL
   * @param result
   * @returns
   */
  parseS3Result(result: any, filename: string): UploadResult {
    // AWS.S3.ManagedUpload.SendData[]
    const parsed: UploadResult | any = {};
    parsed.filename = filename;
    result.forEach((element, index) => {
      parsed[this.variantKeys[index]] = element.Location;
    });
    return parsed;
  }

  /**
   * Check a url is origin url
   * @param url
   * @returns
   */
  isOriginUrl(url: string) {
    return url.match(/\/(\d{3,4})/g).length == 1;
  }

  async saveVideo(params: SaveImageParams) {
    const tasks: Promise<AWS.S3.ManagedUpload.SendData>[] = [];
    let dataBuffer = params.file.buffer;
    const dataKey = params.folderName.concat('/').concat(params.fileName);

    tasks.push(
      this.s3
        .upload({
          Bucket: this.config.get('AWS_S3_BUCKET'),
          ContentType: params.file.mimetype,
          Key: dataKey,
          Body: dataBuffer,
          ACL: 'public-read',
        })
        .promise(),
    );
    return Promise.all(tasks);
  }

  isImage(params: SaveFileParams) {
    const lowname = params.file.originalname.toLowerCase();
    if (!lowname.match(this.imgs)) {
      return false;
    }
    return true;
  }

  isVideo(params: SaveFileParams) {
    const lowname = params.file.originalname.toLowerCase();
    if (!lowname.match(this.videos)) {
      return false;
    }
    return true;
  }
}

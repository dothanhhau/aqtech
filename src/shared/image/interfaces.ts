// Save file params
export interface SaveFileParams {
  file: Express.Multer.File;
  fileName?: string;
  folderName: string;
  subfolderName?: string;
  apiSubtype?: string;
  apiType?: string;
  filesPath?: string;
  isProduct?: boolean;
  productSku?: string;
  imageIndex?: number;
  videoIndex?: number;
}

// Save image params
export interface SaveImageParams {
  file: Express.Multer.File;
  fileName?: string;
  folderName: string;
  subfolderName?: string;
  apiSubtype?: string;
  apiType?: string;
  filesPath?: string;
  isProduct?: boolean;
  productSku?: string;
  pictureIndex?: number;
}

export interface SaveVideoParams {
  file: Express.Multer.File;
  fileName?: string;
  folderName: string;
  subfolderName?: string;
  apiSubtype?: string;
  apiType?: string;
  filesPath?: string;
  isProduct?: boolean;
  productSku?: string;
  videoIndex?: number;
}

export interface DeleteImageParams {
  fullUrl: string;
}

export class UploadResult {
  filename: string;
  original: string;
  large: string;
  medium: string;
  small: string;
}
export class SendData {
  Location: string;
}

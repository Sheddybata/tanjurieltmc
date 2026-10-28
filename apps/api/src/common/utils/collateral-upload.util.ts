import { memoryStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { ensureUploadDir } from './object-storage.util';

export function ensureCollateralUploadDir() {
  ensureUploadDir('collateral');
}

export const collateralPhotoStorage = memoryStorage();

const ALLOWED_IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif']);

export function collateralPhotoFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  const ext = extname(file.originalname).toLowerCase();
  const mimeOk = file.mimetype.startsWith('image/');
  const extOk = ALLOWED_IMAGE_EXT.has(ext);
  if (!mimeOk && !extOk) {
    cb(new BadRequestException('Collateral photo must be a JPG, PNG, or WEBP image') as unknown as Error, false);
    return;
  }
  cb(null, true);
}

export function collateralPhotoPublicPath(filename: string) {
  return `/uploads/collateral/${filename}`;
}

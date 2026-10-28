import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { ensureUploadDir } from './object-storage.util';

export function ensureChildSavingsUploadDir() {
  ensureUploadDir('child-savings');
}

export const childSavingsPhotoStorage = memoryStorage();

export function childSavingsPhotoFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Child photo must be an image') as unknown as Error, false);
    return;
  }
  cb(null, true);
}

export function childSavingsPhotoPublicPath(filename: string) {
  return `/uploads/child-savings/${filename}`;
}

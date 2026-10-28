import { memoryStorage } from 'multer';
import { BadRequestException } from '@nestjs/common';
import { persistUploadedImage } from './object-storage.util';
import { ensureUploadDir } from './object-storage.util';

export function ensureCustomerPhotoUploadDir() {
  ensureUploadDir('customer-photos');
}

export const customerPhotoStorage = memoryStorage();

export function customerPhotoFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.match(/^image\/(jpeg|png|webp)$/)) {
    return cb(new BadRequestException('Only JPEG, PNG, or WebP images are allowed') as unknown as Error, false);
  }
  cb(null, true);
}

/** @deprecated use saveCustomerPhoto — kept for callers migrating off disk filenames */
export function customerPhotoPublicPath(filename: string): string {
  return `/uploads/customer-photos/${filename}`;
}

export async function saveCustomerPhoto(file: Express.Multer.File): Promise<string> {
  return persistUploadedImage('customer-photos', file);
}

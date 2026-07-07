import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';

const uploadDir = join(process.cwd(), 'uploads', 'customer-photos');

export function ensureCustomerPhotoUploadDir() {
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

export const customerPhotoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureCustomerPhotoUploadDir();
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${extname(file.originalname) || '.jpg'}`);
  },
});

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

export function customerPhotoPublicPath(filename: string): string {
  return `/uploads/customer-photos/${filename}`;
}

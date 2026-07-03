import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

const uploadDir = join(process.cwd(), 'uploads', 'collateral');

export function ensureCollateralUploadDir() {
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

export const collateralPhotoStorage = diskStorage({
  destination: (_req, _file, cb) => {
    ensureCollateralUploadDir();
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = extname(file.originalname) || '.jpg';
    cb(null, `${uuidv4()}${ext}`);
  },
});

export function collateralPhotoFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.startsWith('image/')) {
    cb(new BadRequestException('Collateral photo must be an image') as unknown as Error, false);
    return;
  }
  cb(null, true);
}

export function collateralPhotoPublicPath(filename: string) {
  return `/uploads/collateral/${filename}`;
}

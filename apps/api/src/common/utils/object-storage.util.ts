import { BadRequestException } from '@nestjs/common';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

export type UploadFolder = 'customer-photos' | 'child-savings' | 'collateral';

const IMAGE_MIME = /^image\/(jpeg|png|webp)$/;

function uploadRoot(): string {
  return join(process.cwd(), 'uploads');
}

export function ensureUploadDir(folder: UploadFolder) {
  const dir = join(uploadRoot(), folder);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function uniqueFilename(originalName: string): string {
  const ext = extname(originalName) || '.jpg';
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
}

function supabaseConfig() {
  const url = process.env.SUPABASE_URL?.replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || 'media';
  if (!url || !key) return null;
  return { url, key, bucket };
}

async function uploadToSupabase(
  folder: UploadFolder,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const cfg = supabaseConfig();
  if (!cfg) {
    throw new Error('Supabase storage is not configured');
  }

  const objectPath = `${folder}/${filename}`;
  const uploadUrl = `${cfg.url}/storage/v1/object/${cfg.bucket}/${objectPath}`;

  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.key}`,
      'Content-Type': contentType,
      'x-upsert': 'true',
    },
    body: new Uint8Array(buffer),
  });

  if (!res.ok) {
    throw new BadRequestException(
      `Photo upload failed (${res.status}). Check Supabase bucket "${cfg.bucket}" exists and is public.`,
    );
  }

  return `${cfg.url}/storage/v1/object/public/${cfg.bucket}/${objectPath}`;
}

async function saveLocal(folder: UploadFolder, filename: string, buffer: Buffer): Promise<string> {
  const dir = ensureUploadDir(folder);
  const fullPath = join(dir, filename);
  await pipeline(Readable.from(buffer), createWriteStream(fullPath));
  return `/uploads/${folder}/${filename}`;
}

/** Persist an uploaded image; returns a URL path or absolute public URL for the database. */
export async function persistUploadedImage(
  folder: UploadFolder,
  file: Express.Multer.File,
): Promise<string> {
  if (!file.mimetype.match(IMAGE_MIME)) {
    throw new BadRequestException('Only JPEG, PNG, or WebP images are allowed');
  }

  const buffer = file.buffer ?? (file.path ? await readFile(file.path) : null);
  if (!buffer?.length) {
    throw new BadRequestException('Photo file is empty');
  }

  const filename = uniqueFilename(file.originalname || 'photo.jpg');
  const cfg = supabaseConfig();

  if (cfg) {
    return uploadToSupabase(folder, filename, buffer, file.mimetype);
  }

  return saveLocal(folder, filename, buffer);
}

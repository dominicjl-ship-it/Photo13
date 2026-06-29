import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { logger } from './logger';

const mkdir = promisify(fs.mkdir);
const unlink = promisify(fs.unlink);
const stat = promisify(fs.stat);

export async function ensureDir(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await unlink(filePath);
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      logger.warn(`Failed to delete file: ${filePath}`, error);
    }
  }
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function getFileSize(filePath: string): Promise<number> {
  const stats = await stat(filePath);
  return stats.size;
}

export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

export function generateFileName(originalName: string, suffix?: string): string {
  const ext = getFileExtension(originalName);
  const baseName = path.basename(originalName, ext);
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const safeName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_').substring(0, 50);
  return suffix
    ? `${safeName}_${suffix}_${timestamp}_${random}${ext}`
    : `${safeName}_${timestamp}_${random}${ext}`;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, '_')
    .replace(/_{2,}/g, '_')
    .substring(0, 255);
}

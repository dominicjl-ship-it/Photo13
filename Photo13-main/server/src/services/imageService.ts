import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import { config } from '../config';
import { ensureDir, generateFileName } from '../utils/fileUtils';
import { logger } from '../utils/logger';
import { ImageMetadata } from '../types';

export class ImageService {
  async extractMetadata(filePath: string): Promise<ImageMetadata> {
    const image = sharp(filePath);
    const metadata = await image.metadata();
    const stats = fs.statSync(filePath);

    return {
      width: metadata.width || 0,
      height: metadata.height || 0,
      format: metadata.format || 'unknown',
      size: stats.size,
      channels: metadata.channels,
      hasAlpha: metadata.hasAlpha,
      density: metadata.density,
    };
  }

  async validateAndCompress(
    filePath: string,
    outputPath: string,
    maxDimension: number = 4096
  ): Promise<string> {
    const metadata = await sharp(filePath).metadata();
    const width = metadata.width || 0;
    const height = metadata.height || 0;

    if (width > maxDimension || height > maxDimension) {
      const ratio = Math.min(maxDimension / width, maxDimension / height);
      await sharp(filePath)
        .resize(Math.round(width * ratio), Math.round(height * ratio), { fit: 'inside' })
        .toFile(outputPath);
      return outputPath;
    }

    return filePath;
  }

  async compressImage(
    inputPath: string,
    outputPath: string,
    quality: number = 90,
    format: 'jpeg' | 'png' | 'webp' = 'jpeg'
  ): Promise<string> {
    await ensureDir(path.dirname(outputPath));
    
    let pipeline = sharp(inputPath);

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality, compressionLevel: Math.round((100 - quality) / 11) });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }

    await pipeline.toFile(outputPath);
    return outputPath;
  }

  async convertFormat(
    inputPath: string,
    outputPath: string,
    format: 'jpeg' | 'png' | 'webp',
    quality: number = 90
  ): Promise<string> {
    await ensureDir(path.dirname(outputPath));
    
    const ext = format === 'jpeg' ? '.jpg' : `.${format}`;
    const finalOutputPath = outputPath.replace(/\.[^/.]+$/, ext);

    let pipeline = sharp(inputPath);

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, progressive: true });
        break;
      case 'png':
        pipeline = pipeline.png({ quality });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }

    await pipeline.toFile(finalOutputPath);
    return finalOutputPath;
  }

  async postProcessOutput(
    inputPath: string,
    outputPath: string,
    originalPath: string,
    preserveExif: boolean = true
  ): Promise<string> {
    await ensureDir(path.dirname(outputPath));
    
    let pipeline = sharp(inputPath);

    if (preserveExif) {
      try {
        const originalMetadata = await sharp(originalPath).metadata();
        if (originalMetadata.exif) {
          pipeline = pipeline.withMetadata({ exif: { IFD0: {} } });
        } else {
          pipeline = pipeline.withMetadata();
        }
      } catch {
        pipeline = pipeline.withMetadata();
      }
    }

    await pipeline.toFile(outputPath);
    return outputPath;
  }

  async downloadImage(url: string, outputPath: string): Promise<string> {
    await ensureDir(path.dirname(outputPath));

    // Handle base64 data URIs returned by HuggingFace
    if (url.startsWith('data:')) {
      const base64Data = url.split(',')[1];
      fs.writeFileSync(outputPath, Buffer.from(base64Data, 'base64'));
      return outputPath;
    }

    const response = await axios({
      method: 'GET',
      url,
      responseType: 'stream',
    });

    return new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);
      writer.on('finish', () => resolve(outputPath));
      writer.on('error', reject);
    });
  }

  async generateThumbnail(inputPath: string, outputPath: string, size: number = 256): Promise<string> {
    await ensureDir(path.dirname(outputPath));
    await sharp(inputPath)
      .resize(size, size, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
    return outputPath;
  }

  async convertToBase64ForReplicate(filePath: string): Promise<string> {
    const buffer = fs.readFileSync(filePath);
    const metadata = await sharp(filePath).metadata();
    const mimeType = `image/${metadata.format || 'jpeg'}`;
    return `data:${mimeType};base64,${buffer.toString('base64')}`;
  }

  async sharpenImage(inputPath: string, outputPath: string, strength: number = 1): Promise<string> {
    await ensureDir(path.dirname(outputPath));
    const sigma = 0.5 + strength * 1.5;
    await sharp(inputPath)
      .sharpen({ sigma, m1: strength, m2: strength * 10 })
      .toFile(outputPath);
    return outputPath;
  }

  async denoiseImage(inputPath: string, outputPath: string, strength: number = 1): Promise<string> {
    await ensureDir(path.dirname(outputPath));
    await sharp(inputPath)
      .median(strength > 0.5 ? 3 : 1)
      .blur(0.3 * strength)
      .toFile(outputPath);
    return outputPath;
  }
}

export const imageService = new ImageService();

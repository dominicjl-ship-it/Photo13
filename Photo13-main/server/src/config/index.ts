import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  replicateApiToken: process.env.REPLICATE_API_TOKEN || '',
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  uploadDir: process.env.UPLOAD_DIR || path.resolve(process.cwd(), 'uploads'),
  outputDir: process.env.OUTPUT_DIR || path.resolve(process.cwd(), 'outputs'),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '52428800', 10),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  logLevel: process.env.LOG_LEVEL || 'info',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};

export const REPLICATE_MODELS = {
  upscale: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
  faceRestore: 'tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3',
  codeformer: 'sczhou/codeformer:7de268f79cc0c8f89ea24a83e1e63a3286b2dced90e7de01e46b7a51bba4ea07',
  backgroundRemove: 'lucataco/remove-bg:95fcc2a26d3899cd6c2691c900465aaeff466285a65c14638cc5f36f34befaf1',
  sharpen: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
  denoise: 'nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b',
  swinir: 'jingyunliang/swinir:660d922d33153019e8c263a3bba265de882e7f4f70396546b6c9ce94696d7b36',
};

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/heic',
  'image/heif',
];

export const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.tif', '.heic', '.heif'];

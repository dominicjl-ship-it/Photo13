import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../utils/errors';

export function validateUpscaleRequest(req: Request, res: Response, next: NextFunction): void {
  const { imageId, scale, model, faceEnhance } = req.body;

  if (!imageId || typeof imageId !== 'string') {
    throw new ValidationError('imageId is required');
  }
  if (!scale || ![2, 4, 8].includes(Number(scale))) {
    throw new ValidationError('scale must be 2, 4, or 8');
  }
  if (model && !['real-esrgan', 'swinir'].includes(model)) {
    throw new ValidationError('model must be real-esrgan or swinir');
  }

  req.body.scale = Number(scale);
  req.body.faceEnhance = faceEnhance === true || faceEnhance === 'true';
  next();
}

export function validateFaceRestoreRequest(req: Request, res: Response, next: NextFunction): void {
  const { imageId, model, fidelity, backgroundEnhance, upscale } = req.body;

  if (!imageId || typeof imageId !== 'string') {
    throw new ValidationError('imageId is required');
  }
  if (model && !['gfpgan', 'codeformer'].includes(model)) {
    throw new ValidationError('model must be gfpgan or codeformer');
  }
  if (fidelity !== undefined && (Number(fidelity) < 0 || Number(fidelity) > 1)) {
    throw new ValidationError('fidelity must be between 0 and 1');
  }

  req.body.fidelity = fidelity !== undefined ? Number(fidelity) : 0.7;
  req.body.upscale = upscale !== undefined ? Number(upscale) : 2;
  req.body.backgroundEnhance = backgroundEnhance === true || backgroundEnhance === 'true';
  next();
}

export function validateCompressRequest(req: Request, res: Response, next: NextFunction): void {
  const { imageId, quality, format } = req.body;

  if (!imageId || typeof imageId !== 'string') {
    throw new ValidationError('imageId is required');
  }
  if (quality !== undefined && (Number(quality) < 1 || Number(quality) > 100)) {
    throw new ValidationError('quality must be between 1 and 100');
  }
  if (format && !['jpeg', 'png', 'webp'].includes(format)) {
    throw new ValidationError('format must be jpeg, png, or webp');
  }

  req.body.quality = quality !== undefined ? Number(quality) : 80;
  next();
}

export function validateConvertRequest(req: Request, res: Response, next: NextFunction): void {
  const { imageId, format, quality } = req.body;

  if (!imageId || typeof imageId !== 'string') {
    throw new ValidationError('imageId is required');
  }
  if (!format || !['jpeg', 'png', 'webp'].includes(format)) {
    throw new ValidationError('format must be jpeg, png, or webp');
  }

  req.body.quality = quality !== undefined ? Number(quality) : 90;
  next();
}

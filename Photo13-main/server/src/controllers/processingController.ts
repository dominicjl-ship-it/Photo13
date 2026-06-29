import { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { jobService } from '../services/jobService';
import { imageRepository } from '../repositories/imageRepository';
import { config } from '../config';
import { logger } from '../utils/logger';
import { NotFoundError, ValidationError } from '../utils/errors';
import { JobSettings } from '../types';

export class ProcessingController {
  async upscaleImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId, scale, model, faceEnhance } = req.body;
      const settings: JobSettings = {
        type: 'upscale',
        upscale: {
          scale: scale as 2 | 4 | 8,
          model: model || 'real-esrgan',
          faceEnhance: faceEnhance || false,
        },
      };
      const result = await jobService.createJob(imageId, settings);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async restoreFace(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId, model, fidelity, backgroundEnhance, upscale } = req.body;
      const settings: JobSettings = {
        type: 'face-restore',
        faceRestore: {
          model: model || 'gfpgan',
          fidelity: fidelity || 0.7,
          backgroundEnhance: backgroundEnhance || false,
          upscale: upscale || 2,
        },
      };
      const result = await jobService.createJob(imageId, settings);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async removeBackground(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId, returnMask, alphaMatting } = req.body;
      const settings: JobSettings = {
        type: 'background-remove',
        backgroundRemove: {
          returnMask: returnMask || false,
          alphaMatting: alphaMatting || false,
        },
      };
      const result = await jobService.createJob(imageId, settings);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sharpenImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId, strength } = req.body;
      if (!imageId) throw new ValidationError('imageId is required');
      const settings: JobSettings = {
        type: 'sharpen',
        sharpen: { strength: strength || 1 },
      };
      const result = await jobService.createJob(imageId, settings);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async denoiseImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId, strength } = req.body;
      if (!imageId) throw new ValidationError('imageId is required');
      const settings: JobSettings = {
        type: 'denoise',
        denoise: { strength: strength || 1 },
      };
      const result = await jobService.createJob(imageId, settings);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async compressImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId, quality, format } = req.body;
      const settings: JobSettings = {
        type: 'compress',
        compress: {
          quality: quality || 80,
          format: format || 'jpeg',
        },
      };
      const result = await jobService.createJob(imageId, settings);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async convertImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId, format, quality } = req.body;
      const settings: JobSettings = {
        type: 'convert',
        convert: {
          format: format || 'png',
          quality: quality || 90,
        },
      };
      const result = await jobService.createJob(imageId, settings);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getJobStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const status = await jobService.getJobStatus(id);
      res.json(status);
    } catch (error) {
      next(error);
    }
  }

  async downloadOutput(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = await jobService.getJob(id);
      
      if (job.status !== 'completed' || !job.outputPath) {
        res.status(404).json({ error: { message: 'Output not ready', code: 'NOT_READY' } });
        return;
      }

      if (!fs.existsSync(job.outputPath)) {
        res.status(404).json({ error: { message: 'Output file not found', code: 'FILE_NOT_FOUND' } });
        return;
      }

      res.download(job.outputPath, job.outputFileName || path.basename(job.outputPath));
    } catch (error) {
      next(error);
    }
  }

  async batchProcess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageIds, enhancement, settings } = req.body;
      
      if (!Array.isArray(imageIds) || imageIds.length === 0) {
        throw new ValidationError('imageIds array is required');
      }

      const jobs = await Promise.all(
        imageIds.map((imageId: string) =>
          jobService.createJob(imageId, { type: enhancement, ...settings })
        )
      );

      res.status(202).json({ jobs });
    } catch (error) {
      next(error);
    }
  }

  async downloadBatchZip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { jobIds } = req.body;

      if (!Array.isArray(jobIds) || jobIds.length === 0) {
        throw new ValidationError('jobIds array is required');
      }

      const archive = archiver('zip', { zlib: { level: 6 } });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename=ai-enhanced-images.zip');
      archive.pipe(res);

      for (const jobId of jobIds) {
        try {
          const job = await jobService.getJob(jobId);
          if (job.status === 'completed' && job.outputPath && fs.existsSync(job.outputPath)) {
            archive.file(job.outputPath, { name: job.outputFileName || path.basename(job.outputPath) });
          }
        } catch {
          logger.warn(`Skipping job ${jobId} in zip - not found or not completed`);
        }
      }

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  }

  async retryJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await jobService.retryJob(id);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const processingController = new ProcessingController();

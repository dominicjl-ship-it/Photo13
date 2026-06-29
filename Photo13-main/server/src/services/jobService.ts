import path from 'path';
import fs from 'fs';
import { prisma } from '../database/client';
import { config } from '../config';
import { logger } from '../utils/logger';
import { imageService } from './imageService';
import { replicateService } from './replicateService';
import { ensureDir, generateFileName, getFileSize } from '../utils/fileUtils';
import { JobSettings, JobStatus, EnhancementType } from '../types';
import { NotFoundError, ReplicateError } from '../utils/errors';

export class JobService {
  async createJob(imageId: string, settings: JobSettings): Promise<{ jobId: string }> {
    const image = await prisma.image.findUnique({ where: { id: imageId } });
    if (!image) throw new NotFoundError('Image');

    const job = await prisma.job.create({
      data: {
        imageId,
        type: settings.type,
        status: 'pending',
        settings: JSON.stringify(settings),
      },
    });

    this.processJob(job.id, image.filePath, settings).catch((err) => {
      logger.error(`Job ${job.id} failed:`, err);
    });

    return { jobId: job.id };
  }

  async processJob(jobId: string, imagePath: string, settings: JobSettings): Promise<void> {
    const startTime = Date.now();

    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'processing' },
    });

    try {
      await ensureDir(config.outputDir);

      let outputUrl: string | null = null;

      const job = await prisma.job.findUnique({
        where: { id: jobId },
        include: { image: true },
      });
      if (!job) throw new NotFoundError('Job');

      const outputFileName = generateFileName(job.image.originalName, settings.type);
      let outputPath: string = path.join(config.outputDir, outputFileName);

      switch (settings.type) {
        case 'upscale': {
          if (!settings.upscale) throw new Error('Upscale settings required');
          const imageBase64 = await imageService.convertToBase64ForReplicate(imagePath);
          outputUrl = await replicateService.upscaleImage(imageBase64, settings.upscale);
          break;
        }
        case 'face-restore': {
          if (!settings.faceRestore) throw new Error('Face restore settings required');
          const imageBase64 = await imageService.convertToBase64ForReplicate(imagePath);
          outputUrl = await replicateService.restoreFace(imageBase64, settings.faceRestore);
          break;
        }
        case 'background-remove': {
          const bgSettings = settings.backgroundRemove || { returnMask: false, alphaMatting: false };
          const imageBase64 = await imageService.convertToBase64ForReplicate(imagePath);
          outputUrl = await replicateService.removeBackground(imageBase64, bgSettings);
          const pngOutputPath = outputPath.replace(/\.[^/.]+$/, '.png');
          outputPath = pngOutputPath;
          break;
        }
        case 'sharpen': {
          const strength = settings.sharpen?.strength || 1;
          await imageService.sharpenImage(imagePath, outputPath, strength);
          outputUrl = null;
          break;
        }
        case 'denoise': {
          const strength = settings.denoise?.strength || 1;
          await imageService.denoiseImage(imagePath, outputPath, strength);
          outputUrl = null;
          break;
        }
        case 'compress': {
          if (!settings.compress) throw new Error('Compress settings required');
          const compressedPath = outputPath.replace(/\.[^/.]+$/, `.${settings.compress.format === 'jpeg' ? 'jpg' : settings.compress.format}`);
          await imageService.compressImage(imagePath, compressedPath, settings.compress.quality, settings.compress.format);
          outputPath = compressedPath;
          outputUrl = null;
          break;
        }
        case 'convert': {
          if (!settings.convert) throw new Error('Convert settings required');
          outputPath = await imageService.convertFormat(imagePath, outputPath, settings.convert.format, settings.convert.quality);
          outputUrl = null;
          break;
        }
        case 'color-restore':
        case 'artifact-remove':
        case 'text-enhance':
        case 'low-light': {
          const imageBase64 = await imageService.convertToBase64ForReplicate(imagePath);
          outputUrl = await replicateService.enhanceWithESRGAN(imageBase64, 2, false);
          break;
        }
        default:
          throw new Error(`Unknown enhancement type: ${settings.type}`);
      }

      if (outputUrl) {
        await imageService.downloadImage(outputUrl, outputPath);
      }

      const processedPath = outputPath.replace(/\.[^/.]+$/, '_processed$&');
      const finalPath = await imageService.postProcessOutput(outputPath, processedPath, imagePath);
      
      try {
        fs.unlinkSync(outputPath);
        outputPath = finalPath;
      } catch {
        // keep original outputPath if unlink fails
      }

      const outputMeta = await imageService.extractMetadata(outputPath);
      const processingTime = Date.now() - startTime;
      const outputFileName2 = path.basename(outputPath);

      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'completed',
          outputPath,
          outputFileName: outputFileName2,
          outputSize: outputMeta.size,
          outputWidth: outputMeta.width,
          outputHeight: outputMeta.height,
          processingTime,
        },
      });

      await prisma.history.create({
        data: {
          imageId: job.imageId,
          jobId,
          enhancement: settings.type,
          settings: JSON.stringify(settings),
          originalSize: job.image.fileSize,
          finalSize: outputMeta.size,
          processingTime,
          outputPath,
        },
      });

      logger.info(`Job ${jobId} completed in ${processingTime}ms`);
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await prisma.job.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage,
          processingTime,
        },
      });

      logger.error(`Job ${jobId} failed:`, error);
      throw error;
    }
  }

  async getJob(jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { image: true },
    });
    if (!job) throw new NotFoundError('Job');
    return job;
  }

  async getJobStatus(jobId: string): Promise<{ status: JobStatus; outputUrl?: string; errorMessage?: string; processingTime?: number }> {
    const job = await prisma.job.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundError('Job');

    return {
      status: job.status as JobStatus,
      outputUrl: job.outputFileName ? `/api/download/${jobId}` : undefined,
      errorMessage: job.errorMessage || undefined,
      processingTime: job.processingTime || undefined,
    };
  }

  async cancelJob(jobId: string): Promise<void> {
    await prisma.job.update({
      where: { id: jobId },
      data: { status: 'cancelled' },
    });
  }

  async retryJob(jobId: string): Promise<{ jobId: string }> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: { image: true },
    });
    if (!job) throw new NotFoundError('Job');
    if (job.status !== 'failed') throw new Error('Only failed jobs can be retried');

    const settings: JobSettings = JSON.parse(job.settings || '{}');
    const newJob = await prisma.job.create({
      data: {
        imageId: job.imageId,
        type: job.type,
        status: 'pending',
        settings: job.settings,
      },
    });

    this.processJob(newJob.id, job.image.filePath, settings).catch((err) => {
      logger.error(`Retry job ${newJob.id} failed:`, err);
    });

    return { jobId: newJob.id };
  }
}

export const jobService = new JobService();

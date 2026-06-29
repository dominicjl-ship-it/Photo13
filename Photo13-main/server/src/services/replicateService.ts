import Replicate from 'replicate';
import { config, REPLICATE_MODELS } from '../config';
import { logger } from '../utils/logger';
import { ReplicateError } from '../utils/errors';
import {
  UpscaleSettings,
  FaceRestoreSettings,
  BackgroundRemoveSettings,
} from '../types';

export class ReplicateService {
  private client: Replicate;

  constructor() {
    this.client = new Replicate({ auth: config.replicateApiToken });
  }

  async upscaleImage(imageUrl: string, settings: UpscaleSettings): Promise<string> {
    try {
      logger.info(`Starting upscale: scale=${settings.scale}, model=${settings.model}`);

      const modelId = settings.model === 'swinir'
        ? REPLICATE_MODELS.swinir
        : REPLICATE_MODELS.upscale;

      const input: Record<string, unknown> = {
        image: imageUrl,
        scale: settings.scale,
        face_enhance: settings.faceEnhance,
      };

      const output = await this.client.run(modelId as `${string}/${string}:${string}`, { input });
      
      const outputUrl = this.extractOutputUrl(output);
      if (!outputUrl) throw new ReplicateError('No output URL returned from upscale');
      
      logger.info(`Upscale completed: ${outputUrl}`);
      return outputUrl;
    } catch (error) {
      logger.error('Replicate upscale error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async restoreFace(imageUrl: string, settings: FaceRestoreSettings): Promise<string> {
    try {
      logger.info(`Starting face restoration: model=${settings.model}`);

      const modelId = settings.model === 'codeformer'
        ? REPLICATE_MODELS.codeformer
        : REPLICATE_MODELS.faceRestore;

      const input: Record<string, unknown> = settings.model === 'codeformer'
        ? {
            image: imageUrl,
            codeformer_fidelity: settings.fidelity,
            background_enhance: settings.backgroundEnhance,
            face_upsample: settings.upscale > 1,
            upscale: settings.upscale,
          }
        : {
            img: imageUrl,
            scale: settings.upscale,
            version: 'v1.4',
          };

      const output = await this.client.run(modelId as `${string}/${string}:${string}`, { input });
      
      const outputUrl = this.extractOutputUrl(output);
      if (!outputUrl) throw new ReplicateError('No output URL returned from face restore');
      
      logger.info(`Face restoration completed: ${outputUrl}`);
      return outputUrl;
    } catch (error) {
      logger.error('Replicate face restore error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async removeBackground(imageUrl: string, settings: BackgroundRemoveSettings): Promise<string> {
    try {
      logger.info('Starting background removal');

      const input: Record<string, unknown> = {
        image: imageUrl,
      };

      const output = await this.client.run(
        REPLICATE_MODELS.backgroundRemove as `${string}/${string}:${string}`,
        { input }
      );

      const outputUrl = this.extractOutputUrl(output);
      if (!outputUrl) throw new ReplicateError('No output URL returned from background removal');
      
      logger.info(`Background removal completed: ${outputUrl}`);
      return outputUrl;
    } catch (error) {
      logger.error('Replicate background remove error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  async enhanceWithESRGAN(imageUrl: string, scale: number = 4, faceEnhance: boolean = false): Promise<string> {
    try {
      logger.info(`Starting ESRGAN enhancement: scale=${scale}`);

      const output = await this.client.run(
        REPLICATE_MODELS.upscale as `${string}/${string}:${string}`,
        {
          input: {
            image: imageUrl,
            scale,
            face_enhance: faceEnhance,
          },
        }
      );

      const outputUrl = this.extractOutputUrl(output);
      if (!outputUrl) throw new ReplicateError('No output URL returned from ESRGAN');
      
      return outputUrl;
    } catch (error) {
      logger.error('Replicate ESRGAN error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Unknown error');
    }
  }

  private extractOutputUrl(output: unknown): string | null {
    if (typeof output === 'string') return output;
    if (Array.isArray(output) && output.length > 0) {
      return typeof output[0] === 'string' ? output[0] : null;
    }
    if (output && typeof output === 'object' && 'url' in output) {
      return (output as { url: string }).url;
    }
    return null;
  }
}

export const replicateService = new ReplicateService();

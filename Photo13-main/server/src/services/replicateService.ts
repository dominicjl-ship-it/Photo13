import axios from 'axios';
import { logger } from '../utils/logger';
import { ReplicateError } from '../utils/errors';
import {
  UpscaleSettings,
  FaceRestoreSettings,
  BackgroundRemoveSettings,
} from '../types';

// Uses Hugging Face Inference API (free tier)
const HF_API = 'https://api-inference.huggingface.co/models';
const HF_TOKEN = process.env.HUGGING_FACE_TOKEN || '';

async function hfRequest(model: string, imageBase64: string): Promise<Buffer> {
  const imageBuffer = Buffer.from(imageBase64, 'base64');
  const response = await axios.post(
    `${HF_API}/${model}`,
    imageBuffer,
    {
      headers: {
        'Authorization': `Bearer ${HF_TOKEN}`,
        'Content-Type': 'application/octet-stream',
      },
      responseType: 'arraybuffer',
      timeout: 120000,
    }
  );
  return Buffer.from(response.data);
}

export class ReplicateService {
  async upscaleImage(imageBase64: string, settings: UpscaleSettings): Promise<string> {
    try {
      logger.info(`Starting upscale with HuggingFace: scale=${settings.scale}`);
      // Use stabilityai/stable-diffusion-x4-upscaler or fallback to sharp (handled in jobService)
      const result = await hfRequest('stabilityai/stable-diffusion-x4-upscaler', imageBase64);
      const b64 = result.toString('base64');
      logger.info('Upscale completed');
      return `data:image/png;base64,${b64}`;
    } catch (error) {
      logger.error('HF upscale error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Upscale failed');
    }
  }

  async restoreFace(imageBase64: string, settings: FaceRestoreSettings): Promise<string> {
    try {
      logger.info('Starting face restoration with HuggingFace');
      const result = await hfRequest('microsoft/resnet-50', imageBase64);
      const b64 = result.toString('base64');
      return `data:image/png;base64,${b64}`;
    } catch (error) {
      logger.error('HF face restore error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Face restore failed');
    }
  }

  async removeBackground(imageBase64: string, settings: BackgroundRemoveSettings): Promise<string> {
    try {
      logger.info('Starting background removal with HuggingFace');
      const result = await hfRequest('briaai/RMBG-1.4', imageBase64);
      const b64 = result.toString('base64');
      return `data:image/png;base64,${b64}`;
    } catch (error) {
      logger.error('HF bg remove error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Background removal failed');
    }
  }

  async enhanceWithESRGAN(imageBase64: string, scale: number = 4, faceEnhance: boolean = false): Promise<string> {
    try {
      logger.info(`Starting ESRGAN enhancement via HuggingFace`);
      const result = await hfRequest('stabilityai/stable-diffusion-x4-upscaler', imageBase64);
      const b64 = result.toString('base64');
      return `data:image/png;base64,${b64}`;
    } catch (error) {
      logger.error('HF ESRGAN error:', error);
      throw new ReplicateError(error instanceof Error ? error.message : 'Enhancement failed');
    }
  }
}

export const replicateService = new ReplicateService();

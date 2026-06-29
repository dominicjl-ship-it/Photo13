import { Request, Response, NextFunction } from 'express';
import path from 'path';
import { imageRepository } from '../repositories/imageRepository';
import { imageService } from '../services/imageService';
import { config } from '../config';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

export class UploadController {
  async uploadImages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        throw new ValidationError('No files uploaded');
      }

      const uploadedImages = await Promise.all(
        files.map(async (file) => {
          const metadata = await imageService.extractMetadata(file.path);
          
          const image = await imageRepository.create({
            originalName: file.originalname,
            fileName: file.filename,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            width: metadata.width,
            height: metadata.height,
            format: metadata.format,
            exifData: metadata.exif ? JSON.stringify(metadata.exif) : undefined,
          });

          return {
            id: image.id,
            originalName: image.originalName,
            fileName: image.fileName,
            fileSize: image.fileSize,
            mimeType: image.mimeType,
            width: image.width,
            height: image.height,
            format: image.format,
            url: `/api/images/${image.id}`,
            createdAt: image.createdAt,
          };
        })
      );

      logger.info(`Uploaded ${uploadedImages.length} image(s)`);
      res.status(201).json({ images: uploadedImages });
    } catch (error) {
      next(error);
    }
  }

  async getImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const image = await imageRepository.findById(id);
      
      if (!image) {
        res.status(404).json({ error: { message: 'Image not found', code: 'NOT_FOUND' } });
        return;
      }

      res.sendFile(image.filePath);
    } catch (error) {
      next(error);
    }
  }

  async deleteImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const image = await imageRepository.findById(id);
      
      if (!image) {
        res.status(404).json({ error: { message: 'Image not found', code: 'NOT_FOUND' } });
        return;
      }

      await imageRepository.delete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const uploadController = new UploadController();

import { Request, Response, NextFunction } from 'express';
import { historyRepository } from '../repositories/historyRepository';
import { imageRepository } from '../repositories/imageRepository';
import { prisma } from '../database/client';
import { NotFoundError } from '../utils/errors';

export class HistoryController {
  async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string || '50', 10);
      const offset = parseInt(req.query.offset as string || '0', 10);
      const search = req.query.search as string | undefined;
      const enhancement = req.query.enhancement as string | undefined;

      const items = await historyRepository.findAll({ limit, offset, search, enhancement });
      res.json({ items, total: items.length });
    } catch (error) {
      next(error);
    }
  }

  async deleteHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await historyRepository.delete(id);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async clearAllHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await prisma.history.deleteMany({});
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await historyRepository.getStats();
      res.json(stats);
    } catch (error) {
      next(error);
    }
  }

  async toggleFavorite(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { imageId } = req.body;
      if (!imageId) {
        res.status(400).json({ error: { message: 'imageId is required', code: 'VALIDATION_ERROR' } });
        return;
      }

      const existing = await prisma.favorite.findFirst({ where: { imageId } });

      if (existing) {
        await prisma.favorite.delete({ where: { id: existing.id } });
        res.json({ isFavorite: false });
      } else {
        await prisma.favorite.create({ data: { imageId } });
        res.json({ isFavorite: true });
      }
    } catch (error) {
      next(error);
    }
  }

  async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let settings = await prisma.settings.findFirst();
      if (!settings) {
        const user = await prisma.user.upsert({
          where: { id: 'default' },
          update: {},
          create: { id: 'default' },
        });
        settings = await prisma.settings.create({
          data: { userId: user.id },
        });
      }
      res.json(settings);
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let settings = await prisma.settings.findFirst();
      if (!settings) {
        const user = await prisma.user.upsert({
          where: { id: 'default' },
          update: {},
          create: { id: 'default' },
        });
        settings = await prisma.settings.create({ data: { userId: user.id } });
      }

      const updated = await prisma.settings.update({
        where: { id: settings.id },
        data: req.body,
      });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
}

export const historyController = new HistoryController();

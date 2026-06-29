import { prisma } from '../database/client';

export class HistoryRepository {
  async findAll(options: {
    limit?: number;
    offset?: number;
    search?: string;
    enhancement?: string;
    isFavorite?: boolean;
  } = {}) {
    const { limit = 50, offset = 0, search, enhancement } = options;

    const where: Record<string, unknown> = {};
    if (enhancement) where.enhancement = enhancement;
    if (search) {
      where.image = { originalName: { contains: search } };
    }

    const items = await prisma.history.findMany({
      where,
      include: {
        image: true,
        job: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const favorites = await prisma.favorite.findMany({
      select: { imageId: true },
    });
    const favoriteImageIds = new Set(favorites.map((f) => f.imageId));

    return items.map((item) => ({
      ...item,
      isFavorite: favoriteImageIds.has(item.imageId),
    }));
  }

  async delete(id: string) {
    return prisma.history.delete({ where: { id } });
  }

  async getStats() {
    const total = await prisma.job.count();
    const completed = await prisma.job.count({ where: { status: 'completed' } });
    const failed = await prisma.job.count({ where: { status: 'failed' } });
    const active = await prisma.job.count({
      where: { status: { in: ['pending', 'processing'] } },
    });

    const processingTimeAgg = await prisma.job.aggregate({
      where: { status: 'completed', processingTime: { not: null } },
      _avg: { processingTime: true },
    });

    const outputs = await prisma.job.findMany({
      where: { status: 'completed', outputSize: { not: null } },
      select: { outputSize: true },
    });

    const storageUsed = outputs.reduce((acc, j) => acc + (j.outputSize || 0), 0);

    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    const processingHistory = await Promise.all(
      last30Days.map(async (date) => {
        const start = new Date(date);
        const end = new Date(date);
        end.setDate(end.getDate() + 1);
        const count = await prisma.job.count({
          where: { createdAt: { gte: start, lt: end }, status: 'completed' },
        });
        const avgTimeAgg = await prisma.job.aggregate({
          where: { createdAt: { gte: start, lt: end }, status: 'completed', processingTime: { not: null } },
          _avg: { processingTime: true },
        });
        return { date, count, avgTime: Math.round((avgTimeAgg._avg.processingTime || 0) / 1000) };
      })
    );

    return {
      totalProcessed: completed,
      avgProcessingTime: Math.round((processingTimeAgg._avg.processingTime || 0) / 1000),
      storageUsed,
      successRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      failedJobs: failed,
      activeJobs: active,
      processingHistory,
    };
  }
}

export const historyRepository = new HistoryRepository();

import { prisma } from '../database/client';
import { Image } from '@prisma/client';

export class ImageRepository {
  async create(data: {
    originalName: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
    width?: number;
    height?: number;
    format?: string;
    exifData?: string;
    userId?: string;
  }): Promise<Image> {
    return prisma.image.create({ data });
  }

  async findById(id: string): Promise<Image | null> {
    return prisma.image.findUnique({ where: { id } });
  }

  async findAll(limit: number = 50, offset: number = 0): Promise<Image[]> {
    return prisma.image.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async delete(id: string): Promise<Image> {
    return prisma.image.delete({ where: { id } });
  }

  async update(id: string, data: Partial<Image>): Promise<Image> {
    return prisma.image.update({ where: { id }, data });
  }

  async addTag(id: string, tag: string): Promise<Image> {
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) throw new Error('Image not found');
    const existingTags: string[] = image.tags ? JSON.parse(image.tags) : [];
    if (!existingTags.includes(tag)) existingTags.push(tag);
    return prisma.image.update({ where: { id }, data: { tags: JSON.stringify(existingTags) } });
  }

  async removeTag(id: string, tag: string): Promise<Image> {
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) throw new Error('Image not found');
    const existingTags: string[] = image.tags ? JSON.parse(image.tags) : [];
    const newTags = existingTags.filter((t) => t !== tag);
    return prisma.image.update({ where: { id }, data: { tags: JSON.stringify(newTags) } });
  }
}

export const imageRepository = new ImageRepository();

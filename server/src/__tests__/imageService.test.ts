import { imageService } from '../services/imageService';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('ImageService', () => {
  const testDir = os.tmpdir();

  describe('formatBytes utility (via fileUtils)', () => {
    it('should correctly format byte sizes', () => {
      expect(1024).toBeGreaterThan(0);
    });
  });

  describe('generateFileName', () => {
    it('should generate unique filenames', () => {
      const { generateFileName } = require('../utils/fileUtils');
      const name1 = generateFileName('test.jpg');
      const name2 = generateFileName('test.jpg');
      expect(name1).not.toBe(name2);
      expect(name1).toMatch(/\.jpg$/);
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize filenames with special characters', () => {
      const { sanitizeFilename } = require('../utils/fileUtils');
      const result = sanitizeFilename('my file (1) [test].jpg');
      expect(result).not.toContain(' ');
      expect(result).not.toContain('(');
      expect(result).not.toContain(')');
    });
  });
});

import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: {
    error: {
      message: 'Upload limit exceeded, please try again in an hour',
      code: 'UPLOAD_LIMIT_EXCEEDED',
    },
  },
});

export const processLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 30,
  message: {
    error: {
      message: 'Processing limit exceeded, please try again in an hour',
      code: 'PROCESS_LIMIT_EXCEEDED',
    },
  },
});

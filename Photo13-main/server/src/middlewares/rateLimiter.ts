import rateLimit from 'express-rate-limit';

export const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 1000, // very generous for polling
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }, // fix the trust proxy warning
  message: {
    error: {
      message: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
  },
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  validate: { xForwardedForHeader: false },
  message: {
    error: {
      message: 'Upload limit exceeded, please try again in an hour',
      code: 'UPLOAD_LIMIT_EXCEEDED',
    },
  },
});

export const processLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  validate: { xForwardedForHeader: false },
  message: {
    error: {
      message: 'Processing limit exceeded, please try again in an hour',
      code: 'PROCESS_LIMIT_EXCEEDED',
    },
  },
});

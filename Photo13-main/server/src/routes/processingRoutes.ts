import { Router } from 'express';
import { processingController } from '../controllers/processingController';
import { processLimiter } from '../middlewares/rateLimiter';
import {
  validateUpscaleRequest,
  validateFaceRestoreRequest,
  validateCompressRequest,
  validateConvertRequest,
} from '../validators/imageValidators';

const router = Router();

router.post('/upscale', processLimiter, validateUpscaleRequest, processingController.upscaleImage.bind(processingController));
router.post('/restore-face', processLimiter, validateFaceRestoreRequest, processingController.restoreFace.bind(processingController));
router.post('/background-remove', processLimiter, processingController.removeBackground.bind(processingController));
router.post('/sharpen', processLimiter, processingController.sharpenImage.bind(processingController));
router.post('/denoise', processLimiter, processingController.denoiseImage.bind(processingController));
router.post('/compress', processLimiter, validateCompressRequest, processingController.compressImage.bind(processingController));
router.post('/convert', processLimiter, validateConvertRequest, processingController.convertImage.bind(processingController));
router.post('/batch', processLimiter, processingController.batchProcess.bind(processingController));
router.post('/batch/download', processingController.downloadBatchZip.bind(processingController));

router.get('/jobs/:id', processingController.getJobStatus.bind(processingController));
router.post('/jobs/:id/retry', processingController.retryJob.bind(processingController));
router.get('/download/:id', processingController.downloadOutput.bind(processingController));

export default router;

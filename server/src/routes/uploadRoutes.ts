import { Router } from 'express';
import { uploadController } from '../controllers/uploadController';
import { uploadMiddleware } from '../middlewares/upload';
import { uploadLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.post('/upload', uploadLimiter, (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err) return next(err);
    uploadController.uploadImages(req, res, next);
  });
});

router.get('/images/:id', uploadController.getImage.bind(uploadController));
router.delete('/images/:id', uploadController.deleteImage.bind(uploadController));

export default router;

import { Router } from 'express';
import uploadRoutes from './uploadRoutes';
import processingRoutes from './processingRoutes';
import historyRoutes from './historyRoutes';

const router = Router();

router.use('/', uploadRoutes);
router.use('/', processingRoutes);
router.use('/', historyRoutes);

export default router;

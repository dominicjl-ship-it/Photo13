import { Router } from 'express';
import { historyController } from '../controllers/historyController';

const router = Router();

router.get('/history', historyController.getHistory.bind(historyController));
router.delete('/history/all', historyController.clearAllHistory.bind(historyController));
router.delete('/history/:id', historyController.deleteHistory.bind(historyController));
router.get('/dashboard', historyController.getDashboardStats.bind(historyController));
router.post('/favorites', historyController.toggleFavorite.bind(historyController));
router.get('/settings', historyController.getSettings.bind(historyController));
router.put('/settings', historyController.updateSettings.bind(historyController));

export default router;

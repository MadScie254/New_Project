import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller';
import { authGuard } from '../middleware/auth.guard';

const router = Router();

router.use(authGuard);

router.get('/', (req, res) => notificationController.getAll(req, res));
router.get('/unread-count', (req, res) => notificationController.getUnreadCount(req, res));
router.put('/:notificationId/read', (req, res) => notificationController.markRead(req, res));
router.put('/read-all', (req, res) => notificationController.markAllRead(req, res));

export default router;

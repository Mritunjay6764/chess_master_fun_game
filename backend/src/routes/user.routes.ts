import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/stats', authenticate, userController.getStats);
router.get('/:userId', userController.getUserById);
router.put('/profile', authenticate, userController.updateProfile);

export default router;
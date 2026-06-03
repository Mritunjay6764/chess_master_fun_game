import { Router } from 'express';
import { gameController } from '../controllers/game.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Test endpoint (no auth required)
router.get('/test', gameController.test);
router.get('/dashboard', gameController.getDashboard);

// History MUST come before :gameId
router.get('/history', authenticate, gameController.getHistory);
router.get('/active-game', authenticate, gameController.getActiveGame);
router.get('/queue-status', gameController.getQueueStatus);
router.get('/queue-debug', authenticate, gameController.getQueueDebug);
router.post('/join-queue', authenticate, (req, res) => gameController.joinQueue(req, res));
router.post('/leave-queue', authenticate, (req, res) => gameController.leaveQueue(req, res));
router.get('/:gameId', authenticate, gameController.getGame);
router.post('/:gameId/move', authenticate, gameController.makeMove);
router.post('/:gameId/resign', authenticate, gameController.resign);

export default router;

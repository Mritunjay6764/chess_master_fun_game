import { Router } from 'express';
import { aiController } from '../controllers/ai.controller';

const router = Router();

router.get('/best-move', aiController.getBestMove);
router.get('/suggestions', aiController.getMoveSuggestions);

export default router;
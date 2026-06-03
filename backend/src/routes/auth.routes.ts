import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { registerDto } from '../dto/register.dto';
import { loginDto } from '../dto/login.dto';

const router = Router();
router.post('/register', validate(registerDto), authController.register);
router.post('/login', validate(loginDto), authController.login);
router.get('/profile', authenticate, authController.getProfile);
router.post('/logout', authenticate, authController.logout);
export default router;
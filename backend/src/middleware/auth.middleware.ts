import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) { res.status(401).json({ error: 'No token' }); return; }
  const payload = verifyToken(auth.substring(7));
  if (!payload) { res.status(401).json({ error: 'Invalid token' }); return; }
  (req as any).user = payload; next();
};
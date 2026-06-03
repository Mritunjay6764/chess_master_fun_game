import bcrypt from 'bcryptjs';
import prisma from '../config/prisma';
import { generateToken, JwtPayload } from '../utils/jwt';
import { createLogger } from '../utils/logger';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';

const logger = createLogger('auth-service');

export class AuthService {
  async register(data: RegisterDto) {
    const exists = await prisma.user.findFirst({ where: { OR: [{ email: data.email }, { username: data.username }] } });
    if (exists) throw new Error('Email or username already exists');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await prisma.user.create({
      data: { email: data.email, username: data.username, passwordHash, elo: 1000 },
      select: { id: true, email: true, username: true, elo: true, createdAt: true }
    });
    const token = this.generateToken(user.id, user.email, user.username);
    logger.info('User registered', { userId: user.id });
    return { user, token };
  }

  async login(data: LoginDto) {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await bcrypt.compare(data.password, user.passwordHash))) throw new Error('Invalid credentials');
    const token = this.generateToken(user.id, user.email, user.username);
    logger.info('User logged in', { userId: user.id });
    return { user: { id: user.id, email: user.email, username: user.username, elo: user.elo, wins: user.wins, losses: user.losses, draws: user.draws, gamesPlayed: user.gamesPlayed }, token };
  }

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, username: true, elo: true, wins: true, losses: true, draws: true, gamesPlayed: true, createdAt: true } });
    if (!user) throw new Error('User not found');
    return user;
  }

  private generateToken(userId: string, email: string, username: string): string {
    return generateToken({ userId, email, username });
  }
}
export const authService = new AuthService();
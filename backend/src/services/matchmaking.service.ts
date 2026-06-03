import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger('matchmaking-service');

interface TimeControl {
  key: string;
  label: string;
  baseSeconds: number;
  incrementSeconds: number;
}

interface MatchmakingPlayer { userId: string; username: string; elo: number; timestamp: number; socketId?: string; timeControl?: TimeControl; }

// In-memory queue
let matchmakingQueue: MatchmakingPlayer[] = [];

export class MatchmakingService {
  async addToQueue(player: MatchmakingPlayer): Promise<boolean> {
    const inQueue = matchmakingQueue.some(p => p.userId === player.userId);
    if (inQueue) return false;
    matchmakingQueue.push(player);
    logger.info('Player added to queue', { userId: player.userId, queueLength: matchmakingQueue.length });
    return true;
  }
  async removeFromQueue(userId: string): Promise<void> {
    matchmakingQueue = matchmakingQueue.filter(p => p.userId !== userId);
    logger.info('Player removed from queue', { userId });
  }
  async getQueuePosition(userId: string): Promise<number> {
    const index = matchmakingQueue.findIndex(p => p.userId === userId);
    return index === -1 ? -1 : matchmakingQueue.length - index;
  }
  async matchPlayers(): Promise<{ white: MatchmakingPlayer; black: MatchmakingPlayer; gameId: string } | null> {
    if (matchmakingQueue.length < 2) return null;
    const player1 = matchmakingQueue.shift()!;
    const player2 = matchmakingQueue.shift()!;
    const gameId = uuidv4();
    const isWhiteRandom = Math.random() > 0.5;
    const white = isWhiteRandom ? player1 : player2;
    const black = isWhiteRandom ? player2 : player1;
    logger.info('Players matched', { gameId, white: white.userId, black: black.userId });
    return { white, black, gameId };
  }
  async getQueueLength(): Promise<number> { return matchmakingQueue.length; }
  async getQueueInfo(): Promise<MatchmakingPlayer[]> { return [...matchmakingQueue]; }
}
export const matchmakingService = new MatchmakingService();
// backend/src/websocket/game.socket.ts
import { Server } from 'socket.io';
import { setupSocketEvents } from './socketEvents';
import { startMatchmakingScheduler } from './matchmaking.scheduler';
import { gameService } from '../services/game.service';
import { createLogger } from '../utils/logger';

const logger = createLogger('game-socket');

export function initializeGameSocket(io: Server): void {
  // Give game service access to io so it can emit events
  gameService.setSocketIO(io);
  setupSocketEvents(io);
  startMatchmakingScheduler(io);
  logger.info('Game socket initialized');
}

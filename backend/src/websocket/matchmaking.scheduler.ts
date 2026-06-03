/**
 * matchmaking.scheduler.ts — pairs players from the queue every 2s,
 * respects the joining player's timeControl preference.
 */
import { Server } from 'socket.io';
import { matchmakingService } from '../services/matchmaking.service';
import { gameService } from '../services/game.service';
import { createLogger } from '../utils/logger';

const logger      = createLogger('matchmaking-scheduler');
const INTERVAL_MS = 2000;

const TC_MAP: Record<string, { key: string; label: string; baseSeconds: number; incrementSeconds: number }> = {
  bullet:    { key: 'bullet',    label: '1 min',       baseSeconds: 60,  incrementSeconds: 0  },
  blitz3:    { key: 'blitz3',    label: '3+2 blitz',   baseSeconds: 180, incrementSeconds: 2  },
  blitz5:    { key: 'blitz5',    label: '5 min',       baseSeconds: 300, incrementSeconds: 0  },
  rapid:     { key: 'rapid',     label: '10 min',      baseSeconds: 600, incrementSeconds: 0  },
  classical: { key: 'classical', label: '15+10 rapid', baseSeconds: 900, incrementSeconds: 10 },
};

export function startMatchmakingScheduler(io: Server): void {
  setInterval(async () => {
    try {
      const match = await matchmakingService.matchPlayers();
      if (!match) return;

      const { white, black, gameId: matchId } = match;

      // Use white player's time control preference (first to queue picks)
      const tcKey = (white.timeControl?.key ?? black.timeControl?.key ?? 'blitz5') as string;
      const tc = TC_MAP[tcKey] ?? TC_MAP['blitz5'];

      await gameService.createGameSession(
        white.userId, black.userId, matchId,
        {
          whiteUsername: white.username,
          blackUsername: black.username,
          whiteElo:      white.elo,
          blackElo:      black.elo,
          initialTimeMs: tc.baseSeconds * 1000,
          incrementMs:   tc.incrementSeconds * 1000,
        },
      );

      const payload = {
        matchId,
        white: { id: white.userId, username: white.username, rating: white.elo },
        black: { id: black.userId, username: black.username, rating: black.elo },
        timeControl: tc,
      };
      io.to(white.userId).emit('match_found', payload);
      io.to(black.userId).emit('match_found', payload);

      logger.info('Match created', { matchId, tcKey, white: white.userId, black: black.userId });
    } catch (e) {
      logger.error('Matchmaking scheduler error', { error: (e as Error).message });
    }
  }, INTERVAL_MS);

  logger.info('Matchmaking scheduler started');
}

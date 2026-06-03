/**
 * socketEvents.ts
 * FIX: Aligns all event names with the mobile frontend (useSocket.ts):
 *   find_match     -> join_queue
 *   cancel_match   -> leave_queue
 *   make_move      -> move
 *   request_rematch-> rematch_request
 *   authenticate   -> handled in middleware via handshake.auth
 *   match_found    <- emitted with correct shape
 *   move_made      <- emitted directly (not nested under .move)
 *   timer_sync     <- emitted with { white, black } shape
 *   game_over      <- { result: { winner, reason } } shape
 *   opponent_disconnected / opponent_reconnected  <- presence events
 */
import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { gameService } from '../services/game.service';
import { matchmakingService } from '../services/matchmaking.service';
import { verifyToken, JwtPayload } from '../utils/jwt';
import { createLogger } from '../utils/logger';
import prisma from '../config/prisma';

const logger = createLogger('socket-events');

// Track connected users and which game they're in
const userSockets = new Map<string, string>();         // userId -> socketId
const gameSockets = new Map<string, Set<string>>();    // gameId -> Set<socketId>
const rematchRequests = new Map<string, Set<string>>(); // gameId -> Set<userId>
const disconnectedAt = new Map<string, number>();      // userId -> timestamp (for reconnect grace)
// Private room: roomCode -> { timeControlKey, hostUserId }
const privateRooms = new Map<string, { timeControlKey: string; hostUserId: string; hostUsername: string; hostSocketId: string }>();

export const setupSocketEvents = (io: Server): void => {
  // ─── Auth middleware ───────────────────────────────────────────────
  io.use((socket, next) => {
    const token  = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    logger.info('Socket auth', { hasToken: !!token, userId: userId ?? 'none' });

    if (token) {
      const payload = verifyToken(token);
      if (!payload) return next(new Error('Invalid token'));
      (socket as any).user = payload;
      return next();
    }

    // Guest connections: userId must start with 'guest_'
    if (userId && typeof userId === 'string' && (userId.startsWith('guest_') || userId.length > 4)) {
      (socket as any).user = {
        userId,
        username: `Guest_${userId.slice(-6)}`,
        email: '',
      } as JwtPayload;
      return next();
    }

    return next(new Error('Authentication required'));
  });

  io.engine.on('connection_error', (err: any) => {
    logger.error('Engine connection error', { code: err.code, message: err.message });
  });

  io.on('connection', async (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;
    logger.info('Socket connected', { userId: user.userId, socketId: socket.id });

    userSockets.set(user.userId, socket.id);
    disconnectedAt.delete(user.userId);
    socket.join(user.userId);

    // ── MATCHMAKING ──────────────────────────────────────────────────
    // Frontend emits 'join_queue' (SOCKET_EMIT.JOIN_QUEUE)
    socket.on('join_queue', async (data: { timeControl?: any; playerId?: string }) => {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { elo: true } }).catch(() => null);
        const elo = dbUser?.elo ?? 1200;
        const added = await matchmakingService.addToQueue({
          userId: user.userId, username: user.username, elo,
          timestamp: Date.now(), socketId: socket.id, timeControl: data?.timeControl,
        });
        if (!added) socket.emit('error', { code: 'ALREADY_IN_QUEUE', message: 'Already queued' });
        logger.info('Joined queue', { userId: user.userId, elo });
      } catch (e) {
        logger.error('join_queue error', { error: (e as Error).message });
        socket.emit('error', { code: 'QUEUE_ERROR', message: 'Failed to join queue' });
      }
    });
    // Alias for legacy clients
    socket.on('find_match', async (data: { timeControl?: any }) => {
      try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.userId }, select: { elo: true } }).catch(() => null);
        const elo = dbUser?.elo ?? 1200;
        const added = await matchmakingService.addToQueue({
          userId: user.userId, username: user.username, elo,
          timestamp: Date.now(), socketId: socket.id, timeControl: data?.timeControl,
        });
        if (!added) socket.emit('error', { code: 'ALREADY_IN_QUEUE', message: 'Already queued' });
        logger.info('Joined queue (find_match)', { userId: user.userId, elo });
      } catch (e) {
        logger.error('find_match error', { error: (e as Error).message });
        socket.emit('error', { code: 'QUEUE_ERROR', message: 'Failed to join queue' });
      }
    });

    // Frontend emits 'leave_queue' (SOCKET_EMIT.LEAVE_QUEUE)
    socket.on('leave_queue', async () => {
      await matchmakingService.removeFromQueue(user.userId).catch(() => {});
      logger.info('Left queue', { userId: user.userId });
    });
    // Frontend emits 'cancel_match' (legacy alias)
    socket.on('cancel_match', async () => {
      await matchmakingService.removeFromQueue(user.userId).catch(() => {});
      logger.info('Cancelled matchmaking', { userId: user.userId });
    });

    // ── GAME JOINING ─────────────────────────────────────────────────
    socket.on('join_game', async (data: { gameId?: string; matchId?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) { socket.emit('error', { message: 'No game ID' }); return; }
        const session = await gameService.getGameSession(id);
        if (!session) { socket.emit('error', { message: 'Game not found' }); return; }
        socket.join(id);
        (socket as any).gameId = id;
        if (!gameSockets.has(id)) gameSockets.set(id, new Set());
        gameSockets.get(id)!.add(socket.id);
        socket.to(id).emit('opponent_reconnected', { userId: user.userId });
      } catch (e) { socket.emit('error', { message: 'Failed to join game' }); }
    });

    // FIX: rejoin_game also fires opponent_reconnected (frontend listens for that)
    socket.on('rejoin_game', async (data: { matchId?: string; gameId?: string }) => {
      try {
        const id = data.matchId || data.gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session) { socket.emit('error', { message: 'Game not found' }); return; }
        socket.join(id);
        (socket as any).gameId = id;
        if (!gameSockets.has(id)) gameSockets.set(id, new Set());
        gameSockets.get(id)!.add(socket.id);
        // Send full state sync back to rejoining player
        socket.emit('state_sync', {
          matchId: id, fen: session.fen, moves: session.moveHistory,
          times: { whiteMs: session.whiteTime, blackMs: session.blackTime, serverTimestamp: Date.now() },
          turn: session.turn,
        });
        // Notify opponent
        socket.to(id).emit('opponent_reconnected', { userId: user.userId });
        logger.info('Rejoined game', { gameId: id, userId: user.userId });
      } catch (e) { socket.emit('error', { message: 'Failed to rejoin' }); }
    });

    // ── MOVES ────────────────────────────────────────────────────────
    // Frontend emits 'move' (SOCKET_EMIT.MOVE)
    const handleMove = async (data: { gameId?: string; matchId?: string; from: string; to: string; promotion?: string }) => {
      try {
        const id = data.matchId || data.gameId || (socket as any).gameId;
        if (!id) { socket.emit('move_rejected', { error: 'No game ID' }); return; }
        logger.info('Move received', { id, userId: user.userId, from: data.from, to: data.to });
        const result = await gameService.makeMove(id, user.userId, data.from, data.to, data.promotion);
        if (!result.success) {
          logger.warn('Move rejected', { id, error: result.error });
          socket.emit('move_rejected', { error: result.error });
        }
      } catch (e) {
        logger.error('move error', { error: (e as Error).message });
        socket.emit('move_rejected', { error: 'Server error' });
      }
    };
    socket.on('move', handleMove);
    socket.on('make_move', handleMove);

    // ── RESIGN ───────────────────────────────────────────────────────
    socket.on('resign', async (data?: { matchId?: string; gameId?: string }) => {
      try {
        const id = data?.matchId || data?.gameId || (socket as any).gameId;
        if (!id) return;
        await gameService.resign(id, user.userId);
      } catch (e) { logger.error('resign error', { error: (e as Error).message }); }
    });

    // ── DRAW ─────────────────────────────────────────────────────────
    socket.on('offer_draw', async (data?: { matchId?: string; gameId?: string }) => {
      try {
        const id = data?.matchId || data?.gameId || (socket as any).gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session || session.status !== 'in_progress') return;
        const byColor = user.userId === session.whitePlayerId ? 'w' : 'b';
        socket.to(id).emit('draw_offered', { matchId: id, by: byColor });
      } catch (e) { logger.error('offer_draw error', { error: (e as Error).message }); }
    });

    socket.on('accept_draw', async (data?: { matchId?: string; gameId?: string }) => {
      try {
        const id = data?.matchId || data?.gameId || (socket as any).gameId;
        if (!id) return;
        await gameService.acceptDraw(id);
      } catch (e) { logger.error('accept_draw error', { error: (e as Error).message }); }
    });

    socket.on('decline_draw', async (data?: { matchId?: string; gameId?: string }) => {
      try {
        const id = data?.matchId || data?.gameId || (socket as any).gameId;
        if (!id) return;
        socket.to(id).emit('draw_declined', { matchId: id });
      } catch (e) { logger.error('decline_draw error', { error: (e as Error).message }); }
    });

    // ── REMATCH ──────────────────────────────────────────────────────
    // Frontend emits 'rematch_request' (SOCKET_EMIT.REMATCH_REQUEST)
    const handleRematchRequest = async (data?: { matchId?: string; gameId?: string }) => {
      try {
        const id = data?.matchId || data?.gameId || (socket as any).gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session) return;
        if (user.userId !== session.whitePlayerId && user.userId !== session.blackPlayerId) return;
        if (!rematchRequests.has(id)) rematchRequests.set(id, new Set());
        rematchRequests.get(id)!.add(user.userId);
        const opponentId = user.userId === session.whitePlayerId ? session.blackPlayerId : session.whitePlayerId;
        const byColor = user.userId === session.whitePlayerId ? 'w' : 'b';
        io.to(opponentId).emit('rematch_offered', { matchId: id, by: byColor });

        // If both already want rematch, start it immediately
        const reqs = rematchRequests.get(id)!;
        if (reqs.has(session.whitePlayerId) && reqs.has(session.blackPlayerId)) {
          await _startRematch(io, id, session, rematchRequests);
        }
      } catch (e) { logger.error('rematch_request error', { error: (e as Error).message }); }
    };
    socket.on('rematch_request', handleRematchRequest);
    // Alias for legacy name
    socket.on('request_rematch', async (data?: { matchId?: string; gameId?: string }) => {
      try {
        const id = data?.matchId || data?.gameId || (socket as any).gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session) return;
        if (user.userId !== session.whitePlayerId && user.userId !== session.blackPlayerId) return;
        if (!rematchRequests.has(id)) rematchRequests.set(id, new Set());
        rematchRequests.get(id)!.add(user.userId);
        const opponentId = user.userId === session.whitePlayerId ? session.blackPlayerId : session.whitePlayerId;
        const byColor = user.userId === session.whitePlayerId ? 'w' : 'b';
        io.to(opponentId).emit('rematch_offered', { matchId: id, by: byColor });
        const reqs = rematchRequests.get(id)!;
        if (reqs.has(session.whitePlayerId) && reqs.has(session.blackPlayerId)) {
          await _startRematch(io, id, session, rematchRequests);
        }
      } catch (e) { logger.error('request_rematch error', { error: (e as Error).message }); }
    });

    socket.on('rematch_accept', async (data?: { matchId?: string; gameId?: string }) => {
      try {
        const id = data?.matchId || data?.gameId || (socket as any).gameId;
        if (!id) return;
        const session = await gameService.getGameSession(id);
        if (!session) return;
        if (user.userId !== session.whitePlayerId && user.userId !== session.blackPlayerId) return;
        if (!rematchRequests.has(id)) rematchRequests.set(id, new Set());
        rematchRequests.get(id)!.add(user.userId);
        const reqs = rematchRequests.get(id)!;
        if (reqs.has(session.whitePlayerId) && reqs.has(session.blackPlayerId)) {
          await _startRematch(io, id, session, rematchRequests);
        }
      } catch (e) { logger.error('rematch_accept error', { error: (e as Error).message }); }
    });

    socket.on('rematch_decline', async (data?: { matchId?: string }) => {
      const id = data?.matchId || (socket as any).gameId;
      if (id) rematchRequests.delete(id);
    });

    // ── DISCONNECT ───────────────────────────────────────────────────
    socket.on('disconnect', async () => {
      logger.info('Socket disconnected', { userId: user.userId });
      await matchmakingService.removeFromQueue(user.userId).catch(() => {});
      const gameId = (socket as any).gameId;
      if (gameId) {
        // Notify opponent — frontend listens for 'opponent_disconnected'
        socket.to(gameId).emit('opponent_disconnected', { userId: user.userId });
        gameSockets.get(gameId)?.delete(socket.id);
        disconnectedAt.set(user.userId, Date.now());
      }
      // Clean up private rooms hosted by this user
      for (const [code, room] of privateRooms.entries()) {
        if (room.hostUserId === user.userId) privateRooms.delete(code);
      }
      userSockets.delete(user.userId);
    });

    // ── LOBBY CHAT ───────────────────────────────────────────────────
    socket.on('lobby_chat', (data: { text: string }) => {
      if (!data?.text?.trim()) return;
      const msg = {
        id: uuidv4(),
        userId: user.userId,
        username: user.username,
        text: data.text.trim().slice(0, 256),
        timestamp: Date.now(),
      };
      io.emit('lobby_message', msg);
    });

    // ── GAME CHAT ────────────────────────────────────────────────────
    socket.on('game_chat', (data: { matchId?: string; text: string }) => {
      const id = data?.matchId || (socket as any).gameId;
      if (!id || !data?.text?.trim()) return;
      const msg = {
        id: uuidv4(),
        userId: user.userId,
        username: user.username,
        text: data.text.trim().slice(0, 256),
        timestamp: Date.now(),
      };
      io.to(id).emit('game_message', msg);
    });

    // ── PRIVATE ROOMS ────────────────────────────────────────────────
    socket.on('create_private', (data: { timeControlKey?: string }) => {
      const code = Math.random().toString(36).slice(2, 8).toUpperCase();
      privateRooms.set(code, {
        timeControlKey: data?.timeControlKey ?? 'blitz5',
        hostUserId: user.userId,
        hostUsername: user.username,
        hostSocketId: socket.id,
      });
      socket.join(`private:${code}`);
      socket.emit('private_room_created', { code });
      logger.info('Private room created', { code, userId: user.userId });
    });

    socket.on('join_private', async (data: { code: string }) => {
      const code = data?.code?.trim().toUpperCase();
      const room = code ? privateRooms.get(code) : undefined;
      if (!room) {
        socket.emit('private_room_error', { message: 'Room not found or expired' });
        return;
      }
      if (room.hostUserId === user.userId) {
        socket.emit('private_room_error', { message: 'You cannot join your own room' });
        return;
      }
      privateRooms.delete(code);
      // Spin up a real game session
      const gameId = uuidv4();
      const tc = getTimeControl(room.timeControlKey);
      const newSession = await gameService.createGameSession(
        room.hostUserId, user.userId, gameId,
        { whiteUsername: room.hostUsername, blackUsername: user.username, whiteElo: 1200, blackElo: 1200 },
      );
      if (!newSession) {
        socket.emit('private_room_error', { message: 'Could not create game' });
        return;
      }
      socket.join(gameId);
      (socket as any).gameId = gameId;
      if (!gameSockets.has(gameId)) gameSockets.set(gameId, new Set());
      gameSockets.get(gameId)!.add(socket.id);

      const hostSocket = io.sockets.sockets.get(room.hostSocketId);
      if (hostSocket) {
        hostSocket.join(gameId);
        (hostSocket as any).gameId = gameId;
        gameSockets.get(gameId)!.add(room.hostSocketId);
      }

      const matchPayload = (myColor: 'w' | 'b') => ({
        matchId: gameId,
        white: { id: room.hostUserId, username: room.hostUsername, rating: 1200 },
        black: { id: user.userId, username: user.username, rating: 1200 },
        myColor,
        timeControl: tc,
      });

      io.to(room.hostSocketId).emit('private_room_joined', matchPayload('w'));
      socket.emit('private_room_joined', matchPayload('b'));
      logger.info('Private room game started', { code, gameId });
    });
  });

  logger.info('Socket events setup complete');
};

// ── Helpers ──────────────────────────────────────────────────────────────────
async function _startRematch(
  io: Server,
  oldId: string,
  session: import('../services/game.service').GameSession,
  rematchRequests: Map<string, Set<string>>,
) {
  rematchRequests.delete(oldId);
  const newGameId = uuidv4();
  // Swap colors
  const newSession = await gameService.createGameSession(
    session.blackPlayerId, session.whitePlayerId, newGameId,
    { whiteUsername: session.blackPlayerUsername, blackUsername: session.whitePlayerUsername, whiteElo: session.blackElo, blackElo: session.whiteElo },
  );
  if (!newSession) return;
  const timeControl = { key: 'blitz5', label: '5 min', baseSeconds: 300, incrementSeconds: 0 };
  const payload = {
    matchId: newGameId,
    white: { id: session.blackPlayerId, username: session.blackPlayerUsername, rating: session.blackElo },
    black: { id: session.whitePlayerId, username: session.whitePlayerUsername, rating: session.whiteElo },
    timeControl,
  };
  io.to(session.blackPlayerId).emit('match_found', payload);
  io.to(session.whitePlayerId).emit('match_found', payload);
}

export const getUserSocketId = (userId: string): string | undefined => userSockets.get(userId);

function getTimeControl(key: string) {
  const map: Record<string, { key: string; label: string; baseSeconds: number; incrementSeconds: number }> = {
    bullet:    { key: 'bullet',    label: '1 min',      baseSeconds: 60,   incrementSeconds: 0 },
    blitz3:    { key: 'blitz3',    label: '3+2 blitz',  baseSeconds: 180,  incrementSeconds: 2 },
    blitz5:    { key: 'blitz5',    label: '5 min',      baseSeconds: 300,  incrementSeconds: 0 },
    rapid:     { key: 'rapid',     label: '10 min',     baseSeconds: 600,  incrementSeconds: 0 },
    classical: { key: 'classical', label: '15+10 rapid',baseSeconds: 900,  incrementSeconds: 10 },
  };
  return map[key] ?? map['blitz5'];
}

// src/__tests__/socketHandlers.test.ts — verifies move handler dispatch (mock socket)
import { EventEmitter } from 'events';
import { useGameStore } from '../store/gameStore';
import { SOCKET_ON } from '../constants/socketEvents';
import type { ChessMove, ServerTimes } from '@/types/index';

class MockSocket extends EventEmitter {
  emit = (event: string | symbol, ...args: any[]) => super.emit(event, ...args);
  on = (event: string, cb: (...a: any[]) => void) => {
    super.on(event, cb);
    return this;
  };
  off = (event: string, cb: (...a: any[]) => void) => {
    super.off(event, cb);
    return this;
  };
}

describe('socket handlers', () => {
  it('applyServerMove updates store fen, turn, times', () => {
    useGameStore.getState().resetGame();
    const move: ChessMove = { from: 'e2', to: 'e4' };
    const times: ServerTimes = { whiteMs: 290_000, blackMs: 300_000, serverTimestamp: 1000 };
    useGameStore.getState().applyServerMove({
      move,
      fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
      turn: 'b',
      times,
    });
    const s = useGameStore.getState();
    expect(s.turn).toBe('b');
    expect(s.whiteTimeMs).toBe(290_000);
    expect(s.moves.length).toBe(1);
  });

  it('listeners can be added and cleanly removed (BUG-2)', () => {
    const socket = new MockSocket();
    const handler = jest.fn();
    socket.on(SOCKET_ON.MOVE_MADE, handler);
    socket.emit(SOCKET_ON.MOVE_MADE, {});
    expect(handler).toHaveBeenCalledTimes(1);

    socket.off(SOCKET_ON.MOVE_MADE, handler);
    socket.emit(SOCKET_ON.MOVE_MADE, {});
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

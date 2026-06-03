// src/__tests__/gameStore.test.ts
import { useGameStore } from '../store/gameStore';
import type { PlayerInfo, TimeControl } from '@/types/index';

const whiteP: PlayerInfo = { id: 'w1', username: 'alice', rating: 1500 };
const blackP: PlayerInfo = { id: 'b1', username: 'bob', rating: 1500 };
const tc: TimeControl = { key: 'blitz5', label: '5+0', baseSeconds: 300, incrementSeconds: 0 };

describe('gameStore', () => {
  beforeEach(() => useGameStore.getState().resetGame());

  it('startMatch wipes prior state (BUG-1)', () => {
    useGameStore.getState().startMatch({
      matchId: 'm1',
      white: whiteP,
      black: blackP,
      myColor: 'w',
      timeControl: tc,
    });
    useGameStore.getState().setDrawOffered('b');
    expect(useGameStore.getState().drawOfferedBy).toBe('b');

    useGameStore.getState().startMatch({
      matchId: 'm2',
      white: whiteP,
      black: blackP,
      myColor: 'w',
      timeControl: tc,
    });
    expect(useGameStore.getState().matchId).toBe('m2');
    expect(useGameStore.getState().drawOfferedBy).toBeNull();
    expect(useGameStore.getState().moves).toEqual([]);
  });

  it('myColor=b flips the board automatically', () => {
    useGameStore.getState().startMatch({
      matchId: 'm1',
      white: whiteP,
      black: blackP,
      myColor: 'b',
      timeControl: tc,
    });
    expect(useGameStore.getState().boardFlipped).toBe(true);
  });

  it('toggleFlip flips the board', () => {
    useGameStore.getState().startMatch({
      matchId: 'm1',
      white: whiteP,
      black: blackP,
      myColor: 'w',
      timeControl: tc,
    });
    expect(useGameStore.getState().boardFlipped).toBe(false);
    useGameStore.getState().toggleFlip();
    expect(useGameStore.getState().boardFlipped).toBe(true);
  });
});

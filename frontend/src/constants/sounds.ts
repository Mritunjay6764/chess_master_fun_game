// src/constants/sounds.ts — sound asset keys (filenames in src/assets/sounds/)
export const SOUND_KEYS = {
  MOVE_SELF: 'move_self.mp3',
  MOVE_OPPONENT: 'move_opponent.mp3',
  CAPTURE: 'capture.mp3',
  CHECK: 'check.mp3',
  CASTLE: 'castle.mp3',
  PROMOTE: 'promote.mp3',
  GAME_START: 'game_start.mp3',
  GAME_END_WIN: 'game_end_win.mp3',
  GAME_END_LOSE: 'game_end_lose.mp3',
  DRAW: 'draw.mp3',
  TICK: 'tick.mp3',
  NOTIFY: 'notify.mp3',
} as const;

export type SoundKey = (typeof SOUND_KEYS)[keyof typeof SOUND_KEYS];

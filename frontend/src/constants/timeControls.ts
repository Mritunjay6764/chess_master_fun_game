// src/constants/timeControls.ts — supported time control presets
import type { TimeControl, TimeControlKey } from '@/types/index';

export const TIME_CONTROLS: Record<TimeControlKey, TimeControl> = {
  bullet: { key: 'bullet', label: 'Bullet 1+0', baseSeconds: 60, incrementSeconds: 0 },
  blitz3: { key: 'blitz3', label: 'Blitz 3+2', baseSeconds: 180, incrementSeconds: 2 },
  blitz5: { key: 'blitz5', label: 'Blitz 5+0', baseSeconds: 300, incrementSeconds: 0 },
  rapid: { key: 'rapid', label: 'Rapid 10+0', baseSeconds: 600, incrementSeconds: 0 },
  classical: { key: 'classical', label: 'Classical 15+10', baseSeconds: 900, incrementSeconds: 10 },
};

export const TIME_CONTROL_LIST: TimeControl[] = Object.values(TIME_CONTROLS);

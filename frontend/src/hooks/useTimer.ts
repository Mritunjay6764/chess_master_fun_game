// src/hooks/useTimer.ts — local countdown corrected on every server sync.
// The server timestamp is the source of truth; we tick locally between syncs.
// KEY FIX: we no longer immediately setSnapshot to raw server values on each
// sync — that caused a one-frame "flash" back to the rounded server time.
// Instead the interval computes the display value every 100ms from the
// server-synced baseline, so the timer runs continuously with no jumps.
import { useEffect, useRef } from 'react';
import { useCallback, useState } from 'react';
import type { Color } from '@/types/index';

interface UseTimerArgs {
  whiteMs: number;
  blackMs: number;
  /** epoch ms at which whiteMs/blackMs were captured by the server */
  lastServerSyncAt: number;
  /** whose clock is currently running */
  activeColor: Color;
  /** when true, both clocks freeze (game over, paused, modal etc.) */
  paused: boolean;
  /** invoked exactly once when active player's clock reaches 0 */
  onFlag?: (color: Color) => void;
}

export interface TimerSnapshot {
  whiteMs: number;
  blackMs: number;
  flagged: Color | null;
}

const TICK_INTERVAL_MS = 100;

export function useTimer({
  whiteMs,
  blackMs,
  lastServerSyncAt,
  activeColor,
  paused,
  onFlag,
}: UseTimerArgs): TimerSnapshot {
  // Seed initial display state from props (only once)
  const [snapshot, setSnapshot] = useState<TimerSnapshot>(() => ({
    whiteMs,
    blackMs,
    flagged: null,
  }));

  const flagFiredRef = useRef(false);
  const onFlagRef = useRef(onFlag);
  onFlagRef.current = onFlag;

  // Reset the flag-fired guard whenever the server re-syncs so a new flagging
  // can fire after a rematch / reconnect.
  useEffect(() => {
    flagFiredRef.current = false;
  }, [whiteMs, blackMs, lastServerSyncAt]);

  useEffect(() => {
    if (paused) return;

    // Capture all values into closure so the interval is stable
    const baseSyncAt  = lastServerSyncAt || Date.now();
    const baseWhiteMs = whiteMs;
    const baseBlackMs = blackMs;
    const active      = activeColor;

    const interval = setInterval(() => {
      const elapsed   = Date.now() - baseSyncAt;
      const nextWhite = active === 'w' ? Math.max(0, baseWhiteMs - elapsed) : baseWhiteMs;
      const nextBlack = active === 'b' ? Math.max(0, baseBlackMs - elapsed) : baseBlackMs;
      const flagged   = nextWhite === 0 ? 'w' : nextBlack === 0 ? 'b' : null;

      setSnapshot({ whiteMs: nextWhite, blackMs: nextBlack, flagged });

      if (flagged && !flagFiredRef.current) {
        flagFiredRef.current = true;
        onFlagRef.current?.(flagged);
      }
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [whiteMs, blackMs, lastServerSyncAt, activeColor, paused]);

  return snapshot;
}

// src/utils/format.ts — small formatting helpers
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m >= 10) return `${m}:${s.toString().padStart(2, '0')}`;
  if (ms < 10_000) {
    // sub-10-second precision shows tenths
    const tenths = Math.max(0, Math.floor((ms % 1000) / 100));
    return `${s}.${tenths}`;
  }
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function pluralize(n: number, single: string, plural?: string): string {
  return `${n} ${n === 1 ? single : plural ?? single + 's'}`;
}

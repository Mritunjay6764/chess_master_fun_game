// src/hooks/useHaptics.ts — exposes the singleton Haptics manager
import { Haptics } from '@utils/hapticManager';

export function useHaptics() {
  return Haptics;
}

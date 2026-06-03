// src/utils/soundManager.ts — creates a fresh AudioPlayer per play call.
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import { SOUND_KEYS, type SoundKey } from '@/constants/sounds';
import { useSettingsStore } from '@store/settingsStore';

// Metro bundles these at compile time — files must exist in src/assets/sounds/
const SOUND_FILES: Record<SoundKey, any> = {
  'move_self.mp3':     require('@assets/sounds/move_self.mp3'),
  'move_opponent.mp3': require('@assets/sounds/move_opponent.mp3'),
  'capture.mp3':       require('@assets/sounds/capture.mp3'),
  'check.mp3':         require('@assets/sounds/check.mp3'),
  'castle.mp3':        require('@assets/sounds/castle.mp3'),
  'promote.mp3':       require('@assets/sounds/promote.mp3'),
  'game_start.mp3':    require('@assets/sounds/game_start.mp3'),
  'game_end_win.mp3':  require('@assets/sounds/game_end_win.mp3'),
  'game_end_lose.mp3': require('@assets/sounds/game_end_lose.mp3'),
  'draw.mp3':          require('@assets/sounds/draw.mp3'),
  'tick.mp3':          require('@assets/sounds/tick.mp3'),
  'notify.mp3':        require('@assets/sounds/notify.mp3'),
};

let audioModeReady = false;

async function ensureAudioMode() {
  if (audioModeReady) return;
  try {
    // expo-audio 1.x uses playsInSilentModeIOS (not playsInSilentMode)
    await setAudioModeAsync({
      playsInSilentModeIOS: true,
      allowsRecordingIOS: false,
      staysActiveInBackground: false,
    } as any);
  } catch {
    // Best-effort — never block playback over audio mode config
  }
  audioModeReady = true;
}

class SoundManager {
  async preload(): Promise<void> {
    await ensureAudioMode();
  }

  async play(key: SoundKey): Promise<void> {
    const { soundEnabled, volume } = useSettingsStore.getState();
    if (!soundEnabled) return;

    const file = SOUND_FILES[key];
    if (!file) return;

    // Ensure audio mode once, non-blocking
    ensureAudioMode().catch(() => {});

    try {
      const player = createAudioPlayer(file);
      player.volume = Math.max(0.1, Math.min(1, volume)); // floor at 0.1 so it's audible
      player.play();
      // Dispose after 10s (longer than any chess sound clip)
      setTimeout(() => {
        try { player.remove(); } catch { /* ignore */ }
      }, 10_000);
    } catch {
      // Silently ignore — a missing sound must never crash the game
    }
  }

  async unloadAll(): Promise<void> {
    // Fresh-player model: nothing to unload globally
  }
}

export const soundManager = new SoundManager();

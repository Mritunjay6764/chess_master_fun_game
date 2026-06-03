// src/utils/hapticManager.ts — wraps expo-haptics
import * as ExpoHaptics from 'expo-haptics';
import { useSettingsStore } from '@store/settingsStore';

function isEnabled(): boolean {
  return useSettingsStore.getState().hapticsEnabled;
}

export const Haptics = {
  trigger(style: ExpoHaptics.ImpactFeedbackStyle | 'notification-success' | 'notification-warning' | 'notification-error' | 'selection'): void {
    if (!isEnabled()) return;
    if (style === 'selection') {
      ExpoHaptics.selectionAsync().catch(() => {});
    } else if (style === 'notification-success') {
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (style === 'notification-warning') {
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Warning).catch(() => {});
    } else if (style === 'notification-error') {
      ExpoHaptics.notificationAsync(ExpoHaptics.NotificationFeedbackType.Error).catch(() => {});
    } else {
      ExpoHaptics.impactAsync(style).catch(() => {});
    }
  },

  // Semantic helpers
  pieceSelected(): void {
    Haptics.trigger(ExpoHaptics.ImpactFeedbackStyle.Light);
  },
  pieceMoved(): void {
    Haptics.trigger(ExpoHaptics.ImpactFeedbackStyle.Medium);
  },
  capture(): void {
    Haptics.trigger(ExpoHaptics.ImpactFeedbackStyle.Heavy);
  },
  check(): void {
    Haptics.trigger('notification-warning');
  },
  win(): void {
    Haptics.trigger('notification-success');
    setTimeout(() => Haptics.trigger('notification-success'), 200);
  },
  lose(): void {
    Haptics.trigger('notification-error');
  },
  illegal(): void {
    Haptics.trigger(ExpoHaptics.ImpactFeedbackStyle.Light);
    setTimeout(() => Haptics.trigger(ExpoHaptics.ImpactFeedbackStyle.Light), 80);
  },
  promote(): void {
    Haptics.trigger(ExpoHaptics.ImpactFeedbackStyle.Medium);
  },
  tick(): void {
    Haptics.trigger('selection');
  },
  rematchPing(): void {
    Haptics.trigger('notification-warning');
  },
};

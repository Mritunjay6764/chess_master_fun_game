// src/components/Toast.tsx — minimal toast (used for draw decline, errors)
import React, { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface Props {
  message: string | null;
  onHide: () => void;
}

export const Toast: React.FC<Props> = ({ message, onHide }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (message) {
      opacity.value = withTiming(1, { duration: 200 });
      translateY.value = withTiming(0, { duration: 200 });
      const id = setTimeout(() => {
        opacity.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(20, { duration: 200 }, () => {});
        setTimeout(onHide, 220);
      }, 2400);
      return () => clearTimeout(id);
    }
  }, [message, opacity, translateY, onHide]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  if (!message) return null;
  return (
    <Animated.View style={[styles.toast, style]} pointerEvents="none">
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: SPACING.xl,
    alignSelf: 'center',
    backgroundColor: COLORS.surfaceAlt,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
  },
  text: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 13 },
});

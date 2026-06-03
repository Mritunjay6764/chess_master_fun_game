// src/components/Timer/CircularTimer.tsx — SVG arc countdown.
// Color: green > 30s, amber 10-30s, red < 10s. Pulses under 10s.
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { COLORS } from '@/constants/theme';
import { formatClock } from '@utils/format';
import { useHaptics } from '@hooks/useHaptics';
import { soundManager } from '@utils/soundManager';
import { SOUND_KEYS } from '@/constants/sounds';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props {
  /** Remaining time in ms for this player. */
  remainingMs: number;
  /** Total seconds for this player's clock (used as the arc denominator). */
  totalSeconds: number;
  /** Whether this player's clock is the active one. */
  active: boolean;
  size?: number;
}

export const CircularTimer: React.FC<Props> = ({
  remainingMs,
  totalSeconds,
  active,
  size = 64,
}) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;

  const seconds = remainingMs / 1000;
  const fraction = Math.max(0, Math.min(1, seconds / Math.max(totalSeconds, 1)));
  const dashOffset = useSharedValue(circumference * (1 - fraction));
  const pulse = useSharedValue(1);
  const haptics = useHaptics();

  useEffect(() => {
    dashOffset.value = withTiming(circumference * (1 - fraction), { duration: 200 });
  }, [fraction, circumference, dashOffset]);

  // Pulse animation when under 10s and active
  useEffect(() => {
    if (active && seconds <= 10 && seconds > 0) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 400 }),
          withTiming(1, { duration: 400 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(pulse);
      pulse.value = withTiming(1);
    }
    return () => cancelAnimation(pulse);
  }, [active, seconds, pulse]);

  // Sub-10s tick: sound + haptic on every whole-second tick while active
  useEffect(() => {
    if (!active || seconds > 10 || seconds <= 0) return;
    const id = setInterval(() => {
      soundManager.play(SOUND_KEYS.TICK);
      haptics.tick();
    }, 1000);
    return () => clearInterval(id);
  }, [active, seconds, haptics]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
  }));

  const color = useMemo(() => {
    if (seconds < 10) return COLORS.timerRed;
    if (seconds < 30) return COLORS.timerAmber;
    return COLORS.timerGreen;
  }, [seconds]);

  return (
    <Animated.View style={[styles.wrapper, { width: size, height: size, transform: [{ scale: pulse }] }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.border}
          strokeWidth={3}
          fill="none"
        />
        {/* Progress arc */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={4}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          // Rotate so the arc starts at the top
          rotation={-90}
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.label} pointerEvents="none">
        <Text style={[styles.text, { color: active ? color : COLORS.textSecondary }]}>
          {formatClock(remainingMs)}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', justifyContent: 'center' },
  label: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700', fontSize: 13, fontVariant: ['tabular-nums'] },
});

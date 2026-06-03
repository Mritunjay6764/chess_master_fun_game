// src/components/Button.tsx — small reusable button
import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, ActivityIndicator } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface Props {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
  style,
}) => {
  const bg =
    variant === 'primary'
      ? COLORS.primary
      : variant === 'danger'
      ? COLORS.danger
      : variant === 'ghost'
      ? 'transparent'
      : COLORS.surfaceAlt;
  const fg =
    variant === 'ghost'
      ? COLORS.textSecondary
      : variant === 'danger'
      ? COLORS.onError
      : COLORS.onPrimary;
  return (
    <Pressable
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={fg} /> : <Text style={[styles.text, { color: fg }]}>{label}</Text>}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  ghost: { borderWidth: 1, borderColor: COLORS.border },
  text: { fontWeight: '700', fontSize: 15 },
});

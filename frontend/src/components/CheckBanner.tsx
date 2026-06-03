// src/components/CheckBanner.tsx — inline banner for check / checkmate / draw
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface Props {
  status: 'check' | 'checkmate' | 'stalemate' | 'draw' | null;
}

const LABEL: Record<NonNullable<Props['status']>, string> = {
  check: 'Check!',
  checkmate: 'Checkmate',
  stalemate: 'Stalemate',
  draw: 'Draw',
};

const COLOR: Record<NonNullable<Props['status']>, string> = {
  check: COLORS.timerAmber,
  checkmate: COLORS.danger,
  stalemate: COLORS.textSecondary,
  draw: COLORS.textSecondary,
};

export const CheckBanner: React.FC<Props> = ({ status }) => {
  if (!status) return null;
  return (
    <View style={[styles.banner, { backgroundColor: COLOR[status] }]}>
      <Text style={styles.text}>{LABEL[status]}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginVertical: SPACING.xs,
  },
  text: { color: '#000', fontWeight: '700', fontSize: 12, letterSpacing: 0.5 },
});

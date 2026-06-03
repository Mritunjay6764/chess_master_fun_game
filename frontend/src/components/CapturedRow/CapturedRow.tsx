// src/components/CapturedRow/CapturedRow.tsx — captured pieces grouped by type
// with material advantage badge. Each capture animates in via scale spring.
import React, { useMemo, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ChessPiece } from '@components/Pieces/MeridaPieces';
import { COLORS } from '@/constants/theme';
import type { Color, PieceSymbol } from '@/types/index';

interface Props {
  /** Piece types captured by the side this row represents. */
  captures: string[];
  /** Color of the pieces displayed (i.e. the captured side, NOT the capturer). */
  capturedColor: Color;
  /** Material advantage from this side's perspective (positive = winning). */
  advantage: number;
  size?: number;
}

const ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

export const CapturedRow: React.FC<Props> = ({ captures, capturedColor, advantage, size = 18 }) => {
  const groups = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of captures) counts[c] = (counts[c] ?? 0) + 1;
    return ORDER.filter((t) => counts[t]).map((t) => ({ type: t, count: counts[t] ?? 0 }));
  }, [captures]);

  return (
    <View style={styles.row}>
      {groups.map((g) => (
        <CapturedGroup key={g.type} type={g.type} count={g.count} color={capturedColor} size={size} />
      ))}
      {advantage > 0 ? <Text style={styles.advantage}>+{advantage}</Text> : null}
    </View>
  );
};

const CapturedGroup: React.FC<{ type: PieceSymbol; count: number; color: Color; size: number }> = ({
  type,
  count,
  color,
  size,
}) => {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [count, scale]);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[styles.group, animated]}>
      <ChessPiece type={type} color={color} size={size} />
      {count > 1 ? <Text style={styles.count}>×{count}</Text> : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  group: { flexDirection: 'row', alignItems: 'center', marginRight: 2 },
  count: { color: COLORS.textSecondary, fontSize: 11, marginLeft: 1 },
  advantage: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
});

// src/components/Board/Square.tsx — a single square (background + overlays).
// Pure presentational; click handling lives in <Board />.
import React, { memo } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import type { Square as SquareId } from '@/types/index';
import type { BoardTheme } from '@/constants/theme';

interface Props {
  square: SquareId;
  isDark: boolean;
  size: number;
  theme: BoardTheme;
  isSelected: boolean;
  isLegalTarget: boolean;
  isLastMove: boolean;
  isCheck: boolean;
  fileLabel?: string;
  rankLabel?: string;
  onPress: (sq: SquareId) => void;
}

function SquareImpl({
  square,
  isDark,
  size,
  theme,
  isSelected,
  isLegalTarget,
  isLastMove,
  isCheck,
  fileLabel,
  rankLabel,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={() => onPress(square)}
      style={{
        width: size,
        height: size,
        backgroundColor: isDark ? theme.dark : theme.light,
      }}
    >
      {/* Overlays — order matters: lastMove < selected < check */}
      {isLastMove ? <View style={[styles.overlay, { backgroundColor: theme.lastMove }]} /> : null}
      {isSelected ? <View style={[styles.overlay, { backgroundColor: theme.selected }]} /> : null}
      {isCheck ? <View style={[styles.overlay, { backgroundColor: theme.check }]} /> : null}

      {/* Legal move dot */}
      {isLegalTarget ? (
        <View style={styles.dotContainer} pointerEvents="none">
          <View
            style={{
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              backgroundColor: theme.legalDot,
            }}
          />
        </View>
      ) : null}

      {/* File / rank labels, only on the appropriate edge squares */}
      {fileLabel ? (
        <Text
          style={[
            styles.fileLabel,
            { color: theme.coordinate, fontSize: Math.max(9, size * 0.18) },
          ]}
        >
          {fileLabel}
        </Text>
      ) : null}
      {rankLabel ? (
        <Text
          style={[
            styles.rankLabel,
            { color: theme.coordinate, fontSize: Math.max(9, size * 0.18) },
          ]}
        >
          {rankLabel}
        </Text>
      ) : null}
    </Pressable>
  );
}

export const BoardSquare = memo(SquareImpl);

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject },
  dotContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileLabel: {
    position: 'absolute',
    right: 2,
    bottom: 0,
    fontWeight: '600',
  },
  rankLabel: {
    position: 'absolute',
    left: 2,
    top: 0,
    fontWeight: '600',
  },
});

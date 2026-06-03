// src/components/Board/AnimatedPiece.tsx — renders a single piece with slide animation
// Move animation: piece slides from previous square to current square using
// withTiming(150ms, Easing.out(Easing.quad)) — runs on the UI thread.
import React, { useEffect, memo } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { ChessPiece } from '@components/Pieces/MeridaPieces';
import type { BoardPiece, Square } from '@/types/index';
import { squareToCoords } from '@utils/chessHelpers';

interface Props {
  piece: BoardPiece;
  tileSize: number;
  flipped: boolean;
  /** Previous square — used to animate the slide on update. */
  previousSquare?: Square | null;
}

function pixelFor(square: Square, tileSize: number, flipped: boolean) {
  const [file, rank] = squareToCoords(square);
  const x = (flipped ? 7 - file : file) * tileSize;
  // Rank 8 (index 7) is the top row visually; flipping inverts vertical axis too.
  const y = (flipped ? rank : 7 - rank) * tileSize;
  return { x, y };
}

function AnimatedPieceImpl({ piece, tileSize, flipped, previousSquare }: Props) {
  const target = pixelFor(piece.square, tileSize, flipped);
  const initial = pixelFor(previousSquare ?? piece.square, tileSize, flipped);

  const tx = useSharedValue(initial.x);
  const ty = useSharedValue(initial.y);

  useEffect(() => {
    tx.value = withTiming(target.x, { duration: 150, easing: Easing.out(Easing.quad) });
    ty.value = withTiming(target.y, { duration: 150, easing: Easing.out(Easing.quad) });
  }, [target.x, target.y, tx, ty]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 0, top: 0 }}>
      <Animated.View
        style={[
          {
            width: tileSize,
            height: tileSize,
          },
          animatedStyle,
        ]}
      >
        <ChessPiece type={piece.type} color={piece.color} size={tileSize} />
      </Animated.View>
    </View>
  );
}

export const AnimatedPiece = memo(AnimatedPieceImpl, (prev, next) => {
  return (
    prev.piece.square === next.piece.square &&
    prev.piece.type === next.piece.type &&
    prev.piece.color === next.piece.color &&
    prev.tileSize === next.tileSize &&
    prev.flipped === next.flipped &&
    prev.previousSquare === next.previousSquare
  );
});

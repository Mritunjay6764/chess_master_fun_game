// src/components/Board/Board.tsx — the chess board: grid + animated pieces.
//
// IMPORTANT (BUG-3): the visible board is derived 100% from the `pieces`
// prop, which is produced from chess.js .board(). We NEVER track piece
// positions in component state.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { BoardSquare } from './Square';
import { AnimatedPiece } from './AnimatedPiece';
import { useSettingsStore } from '@store/settingsStore';
import { BOARD_THEMES, COLORS } from '@/constants/theme';
import { coordsToSquare } from '@utils/chessHelpers';
import type { BoardPiece, ChessMove, Square } from '@/types/index';

const BOARD_PADDING = 8;
const BORDER_WIDTH = 2;

interface Props {
  pieces: BoardPiece[];
  selectedSquare: Square | null;
  legalTargets: Square[];
  lastMove?: ChessMove | null;
  checkSquare?: Square | null;
  flipped: boolean;
  onSquarePress: (sq: Square) => void;
  /** Optional override; defaults to width-based responsive sizing. */
  size?: number;
}

export const Board: React.FC<Props> = ({
  pieces,
  selectedSquare,
  legalTargets,
  lastMove,
  checkSquare,
  flipped,
  onSquarePress,
  size,
}) => {
  const settings = useSettingsStore();
  const theme = BOARD_THEMES[settings.boardTheme];

  const [screenDim, setScreenDim] = useState(Dimensions.get('window'));
  useEffect(() => {
    const handler = ({ window }: { window: import('react-native').ScaledSize }) => setScreenDim(window);
    const sub = Dimensions.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  // Board size: responsive — fills shorter axis at 92%, capped at 600
  const boardSize = size ?? Math.min(
    Math.min(screenDim.width, screenDim.height) * 0.92,
    600,
  );
  const innerSize = boardSize - BORDER_WIDTH * 2;
  const tileSize = innerSize / 8;

  const legalSet = useMemo(() => new Set(legalTargets), [legalTargets]);
  const lastMoveSquares = useMemo(() => {
    if (!settings.showLastMove || !lastMove) return new Set<Square>();
    return new Set<Square>([lastMove.from, lastMove.to]);
  }, [lastMove, settings.showLastMove]);

  // Track each piece's prior square so AnimatedPiece can slide from old → new.
  // Key by a stable identifier ("color+type+initial square") — but since pieces
  // can transform (promotion) and disappear (capture), we key by current square
  // and look up the previous square of *the same piece object identity*.
  const prevSquaresRef = useRef<Map<string, Square>>(new Map());
  // We hash a piece by color+type+square; we approximate "same piece moved" by
  // matching color+type only when exactly one such piece changed square.
  // Simpler scheme: previousSquare for each rendered piece is the square of
  // the most recent move's `from` if it matches color+type — this is good
  // enough for visual smoothness.
  const previousSquareFor = useMemo(() => {
    const map = new Map<Square, Square>();
    if (lastMove) {
      map.set(lastMove.to, lastMove.from);
    }
    return map;
  }, [lastMove]);

  // Pre-compute squares in render order (rank 8 → rank 1, file a → file h).
  // When flipped, reverse both axes so the player's pieces are at the bottom.
  const rows = useMemo(() => {
    const result: { square: Square; isDark: boolean }[][] = [];
    for (let visualRow = 0; visualRow < 8; visualRow++) {
      const rowArr: { square: Square; isDark: boolean }[] = [];
      for (let visualCol = 0; visualCol < 8; visualCol++) {
        const file = flipped ? 7 - visualCol : visualCol;
        const rank = flipped ? visualRow : 7 - visualRow;
        const sq = coordsToSquare(file, rank);
        // dark squares: (file + rank) odd
        rowArr.push({ square: sq, isDark: (file + rank) % 2 === 0 });
      }
      result.push(rowArr);
    }
    return result;
  }, [flipped]);

  return (
    <View
      style={[
        styles.boardWrapper,
        { width: boardSize, height: boardSize, borderColor: theme.border },
      ]}
    >
      {/* The grid of squares */}
      <View style={styles.grid}>
        {rows.map((row, rIdx) => (
          <View key={`row-${rIdx}`} style={styles.row}>
            {row.map(({ square, isDark }, cIdx) => {
              const isSelected = selectedSquare === square;
              const isLegal = settings.showLegalMoves && legalSet.has(square);
              const isLast = lastMoveSquares.has(square);
              const isCheck = checkSquare === square;
              // File label on bottom row; rank label on left column
              const isBottomRow = rIdx === 7;
              const isLeftCol = cIdx === 0;
              const sqFile = square[0]!;
              const sqRank = square[1]!;
              return (
                <BoardSquare
                  key={square}
                  square={square}
                  isDark={isDark}
                  size={tileSize}
                  theme={theme}
                  isSelected={isSelected}
                  isLegalTarget={isLegal}
                  isLastMove={isLast}
                  isCheck={isCheck}
                  fileLabel={isBottomRow ? sqFile : undefined}
                  rankLabel={isLeftCol ? sqRank : undefined}
                  onPress={onSquarePress}
                />
              );
            })}
          </View>
        ))}
      </View>

      {/* Pieces layer (absolute positioning, animated) */}
      <View style={[styles.piecesLayer, { width: innerSize, height: innerSize }]} pointerEvents="none">
        {pieces.map((p) => (
          <AnimatedPiece
            key={`${p.color}${p.type}-${p.square}`}
            piece={p}
            tileSize={tileSize}
            flipped={flipped}
            previousSquare={previousSquareFor.get(p.square) ?? null}
          />
        ))}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  boardWrapper: {
    borderWidth: BORDER_WIDTH,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  grid: { flex: 1 },
  row: { flexDirection: 'row' },
  piecesLayer: {
    position: 'absolute',
    left: BORDER_WIDTH,
    top: BORDER_WIDTH,
  },
});

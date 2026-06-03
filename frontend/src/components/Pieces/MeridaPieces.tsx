// src/components/Pieces/MeridaPieces.tsx
// Lightweight, inline SVG chess pieces in a Merida-inspired style.
// Each piece is a memoized React component so identical pieces never re-render.
import React, { memo } from 'react';
import Svg, { Path, G, Circle, Rect } from 'react-native-svg';
import type { PieceSymbol, Color } from '@/types/index';

interface PieceProps {
  size: number;
}

const WHITE_FILL = '#F8F4E3';
const BLACK_FILL = '#1F1F1F';
const STROKE = '#0B0B0B';
const STROKE_W = 1.3;

/* eslint-disable react/no-unstable-nested-components */

const KingSvg = memo(({ size, fill }: PieceProps & { fill: string }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45">
    <G fill={fill} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
      <Path d="M22.5 11.63V6M20 8h5" strokeLinecap="butt" />
      <Path
        d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5"
        fill={fill}
      />
      <Path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-6.5-13.5-3.5-16 4V27v-3.5c-3.5-7.5-13-10.5-16-4-3 6 5 10 5 10V37z" />
      <Path
        d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0"
        fill="none"
      />
    </G>
  </Svg>
));

const QueenSvg = memo(({ size, fill }: PieceProps & { fill: string }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45">
    <G fill={fill} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
      <Path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11V11l-5.5 13.5-3-15-3 15-5.5-14V25L7 14l2 12z" />
      <Path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 16.5 1 23 0 0 0 1.5-1 0-2.5 0 0 .5-1.5-1-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
      <Circle cx={6} cy={12} r={2} />
      <Circle cx={14} cy={9} r={2} />
      <Circle cx={22.5} cy={8} r={2} />
      <Circle cx={31} cy={9} r={2} />
      <Circle cx={39} cy={12} r={2} />
    </G>
  </Svg>
));

const RookSvg = memo(({ size, fill }: PieceProps & { fill: string }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45">
    <G fill={fill} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
      <Path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM11 14V9h4v2h5V9h5v2h5V9h4v5" />
      <Path d="M34 14l-3 3H14l-3-3" />
      <Path d="M31 17v12.5H14V17" />
      <Path d="M31 29.5l1.5 2.5h-20l1.5-2.5" />
    </G>
  </Svg>
));

const BishopSvg = memo(({ size, fill }: PieceProps & { fill: string }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45">
    <G fill={fill} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
      <Path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2z" />
      <Path d="M15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2z" />
      <Path d="M25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
    </G>
  </Svg>
));

const KnightSvg = memo(({ size, fill }: PieceProps & { fill: string }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45">
    <G fill={fill} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
      <Path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
      <Path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0 .19 1.23-1 2-1 0-4.003 1-4-4 0-2 6-12 6-12s1.89-1.9 2-3.5c-.73-.994-.5-2-.5-3 1-1 3 2.5 3 2.5h2s.78-1.992 2.5-3c1 0 1 3 1 3" />
      <Path d="M9.5 25.5a0.5 0.5 0 1 1-1 0 0.5 0.5 0 1 1 1 0z" fill={STROKE} />
      <Path d="M15 15.5a0.5 1.5 0 1 1-1 0 0.5 1.5 0 1 1 1 0z" fill={STROKE} />
    </G>
  </Svg>
));

const PawnSvg = memo(({ size, fill }: PieceProps & { fill: string }) => (
  <Svg width={size} height={size} viewBox="0 0 45 45">
    <G fill={fill} stroke={STROKE} strokeWidth={STROKE_W} strokeLinejoin="round">
      <Path d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z" />
    </G>
  </Svg>
));

/* eslint-enable react/no-unstable-nested-components */

const RENDERERS: Record<PieceSymbol, React.MemoExoticComponent<React.FC<PieceProps & { fill: string }>>> = {
  k: KingSvg,
  q: QueenSvg,
  r: RookSvg,
  b: BishopSvg,
  n: KnightSvg,
  p: PawnSvg,
};

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  size: number;
}

/**
 * Single entry point for rendering a piece. Memoized by props so identical
 * pieces share render output — important for board redraws.
 */
export const ChessPiece = memo<ChessPieceProps>(({ type, color, size }) => {
  const Renderer = RENDERERS[type];
  if (!Renderer) return null;
  const fill = color === 'w' ? WHITE_FILL : BLACK_FILL;
  return <Renderer size={size} fill={fill} />;
});

ChessPiece.displayName = 'ChessPiece';

// A simple unused export to silence unused-import warnings for Rect
export const _PieceDebugRect = Rect;

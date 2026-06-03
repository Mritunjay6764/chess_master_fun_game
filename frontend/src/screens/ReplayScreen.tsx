// src/screens/ReplayScreen.tsx — full move-by-move game replay with move list
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Board } from '@components/Board/Board';
import { useGameStore } from '@store/gameStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { Chess } from 'chess.js';
import { piecesFromChess } from '@utils/chessHelpers';
import type { BoardPiece, ChessMove } from '@/types/index';

export const ReplayScreen: React.FC = () => {
  const game = useGameStore();
  const allMoves = game.moves;
  const white = game.white;
  const black = game.black;

  const [cursor, setCursor] = useState<number>(allMoves.length);
  const [autoplay, setAutoplay] = useState(false);
  const [speedMs, setSpeedMs] = useState(900);
  const [pieces, setPieces] = useState<BoardPiece[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const moveListRef = useRef<FlatList>(null);

  const rebuildBoard = useCallback((pos: number) => {
    const c = new Chess();
    for (let i = 0; i < pos; i++) {
      const m = allMoves[i];
      if (!m) break;
      try { c.move({ from: m.from as any, to: m.to as any, promotion: m.promotion }); } catch { break; }
    }
    setPieces(piecesFromChess(c));
  }, [allMoves]);

  useEffect(() => { rebuildBoard(cursor); }, [cursor, rebuildBoard]);

  useEffect(() => {
    if (!autoplay) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCursor((c) => {
        if (c >= allMoves.length) { setAutoplay(false); return c; }
        return c + 1;
      });
    }, speedMs);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay, speedMs, allMoves.length]);

  // Scroll move list to active move
  useEffect(() => {
    if (cursor > 0 && moveListRef.current) {
      moveListRef.current.scrollToIndex({ index: Math.max(0, cursor - 1), animated: true, viewPosition: 0.5 });
    }
  }, [cursor]);

  const pairs: { white?: ChessMove; black?: ChessMove; num: number }[] = [];
  for (let i = 0; i < allMoves.length; i += 2) {
    pairs.push({ num: Math.floor(i / 2) + 1, white: allMoves[i], black: allMoves[i + 1] });
  }

  const lastMove = cursor > 0 ? allMoves[cursor - 1] ?? null : null;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Player Header */}
      <View style={styles.playerRow}>
        <PlayerBadge name={black?.username ?? 'Black'} rating={black?.rating} color="b" />
        <View style={styles.vsChip}>
          <Text style={styles.vsText}>{cursor > 0 ? `Move ${cursor}` : 'Start'}</Text>
        </View>
        <PlayerBadge name={white?.username ?? 'White'} rating={white?.rating} color="w" />
      </View>

      {/* Board */}
      <View style={styles.boardWrap}>
        <Board
          pieces={pieces}
          selectedSquare={null}
          legalTargets={[]}
          lastMove={lastMove}
          checkSquare={null}
          flipped={false}
          onSquarePress={() => {}}
          size={340}
        />
      </View>

      {/* Transport controls */}
      <View style={styles.controls}>
        <NavBtn icon="play-skip-back" onPress={() => { setAutoplay(false); setCursor(0); }} />
        <NavBtn icon="play-back" onPress={() => { setAutoplay(false); setCursor((c) => Math.max(0, c - 1)); }} />
        <Pressable
          style={[styles.playBtn, autoplay && styles.playBtnActive]}
          onPress={() => setAutoplay((p) => !p)}
        >
          <Ionicons name={autoplay ? 'pause' : 'play'} size={24} color={COLORS.onPrimary} />
        </Pressable>
        <NavBtn icon="play-forward" onPress={() => { setAutoplay(false); setCursor((c) => Math.min(allMoves.length, c + 1)); }} />
        <NavBtn icon="play-skip-forward" onPress={() => { setAutoplay(false); setCursor(allMoves.length); }} />
      </View>

      {/* Speed + progress */}
      <View style={styles.speedRow}>
        <Text style={styles.speedLabel}>Speed</Text>
        <Pressable style={styles.speedBtn} onPress={() => setSpeedMs((s) => Math.min(3000, s + 300))}>
          <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.speedValue}>{(speedMs / 1000).toFixed(1)}s</Text>
        <Pressable style={styles.speedBtn} onPress={() => setSpeedMs((s) => Math.max(200, s - 300))}>
          <Ionicons name="add" size={16} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${allMoves.length ? (cursor / allMoves.length) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressLabel}>{cursor}/{allMoves.length}</Text>
      </View>

      {/* Move list */}
      {pairs.length > 0 ? (
        <FlatList
          ref={moveListRef}
          data={pairs}
          keyExtractor={(p) => String(p.num)}
          horizontal={false}
          style={styles.moveList}
          contentContainerStyle={styles.moveListContent}
          onScrollToIndexFailed={() => {}}
          renderItem={({ item }) => {
            const wIdx = (item.num - 1) * 2 + 1;
            const bIdx = (item.num - 1) * 2 + 2;
            return (
              <View style={styles.moveRow}>
                <Text style={styles.moveNum}>{item.num}.</Text>
                <Pressable
                  style={[styles.moveChip, cursor === wIdx && styles.moveChipActive]}
                  onPress={() => setCursor(wIdx)}
                >
                  <Text style={[styles.moveSan, cursor === wIdx && styles.moveSanActive]}>
                    {item.white?.san ?? ''}
                  </Text>
                </Pressable>
                {item.black && (
                  <Pressable
                    style={[styles.moveChip, cursor === bIdx && styles.moveChipActive]}
                    onPress={() => setCursor(bIdx)}
                  >
                    <Text style={[styles.moveSan, cursor === bIdx && styles.moveSanActive]}>
                      {item.black?.san ?? ''}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          }}
        />
      ) : (
        <View style={styles.emptyMoves}>
          <Text style={styles.emptyMovesText}>No moves recorded</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const NavBtn: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }> = ({ icon, onPress }) => (
  <Pressable style={styles.navBtn} onPress={onPress}>
    <Ionicons name={icon} size={22} color={COLORS.textPrimary} />
  </Pressable>
);

const PlayerBadge: React.FC<{ name: string; rating?: number; color: 'w' | 'b' }> = ({ name, rating, color }) => (
  <View style={styles.playerBadge}>
    <View style={[styles.colorDot, { backgroundColor: color === 'w' ? '#F0D9B5' : '#333' }]} />
    <View>
      <Text style={styles.playerName} numberOfLines={1}>{name}</Text>
      {rating != null && <Text style={styles.playerRating}>{rating} ELO</Text>}
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  playerBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  colorDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  playerName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', maxWidth: 100 },
  playerRating: { color: COLORS.textSecondary, fontSize: 10 },
  vsChip: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignItems: 'center',
  },
  vsText: { color: COLORS.secondary, fontSize: 12, fontWeight: '700' },
  boardWrap: { alignItems: 'center', paddingVertical: SPACING.sm },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: COLORS.secondary },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  speedLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },
  speedBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  speedValue: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '700', minWidth: 32, textAlign: 'center' },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 2 },
  progressLabel: { color: COLORS.textMuted, fontSize: 11, minWidth: 40, textAlign: 'right' },
  moveList: { flex: 1, borderTopWidth: 1, borderTopColor: COLORS.border },
  moveListContent: { padding: SPACING.sm },
  moveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  moveNum: {
    color: COLORS.textMuted,
    fontSize: 12,
    width: 28,
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  moveChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    minWidth: 60,
  },
  moveChipActive: { backgroundColor: COLORS.primary },
  moveSan: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600', fontFamily: 'monospace' },
  moveSanActive: { color: COLORS.onPrimary },
  emptyMoves: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  emptyMovesText: { color: COLORS.textMuted, fontSize: 14 },
});

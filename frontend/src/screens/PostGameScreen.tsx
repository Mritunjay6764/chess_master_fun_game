// src/screens/PostGameScreen.tsx — result banner + rematch flow (BUG-6)
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Board } from '@components/Board/Board';
import { MoveHistoryList } from '@components/MoveHistoryList';
import { Button } from '@components/Button';
import { Toast } from '@components/Toast';
import { useChessGame } from '@hooks/useChessGame';
import { useSocket } from '@hooks/useSocket';
import { useGameStore } from '@store/gameStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { SOCKET_EMIT, SOCKET_ON } from '@/constants/socketEvents';

import type { Color, PlayerInfo, TimeControl } from '@/types/index';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PostGame'>;
type Route = RouteProp<RootStackParamList, 'PostGame'>;

export const PostGameScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { matchId, result } = route.params;
  const { socket, emit } = useSocket();
  const game = useGameStore();
  // Show the FINAL position; reuse the cached fen from store
  const chess = useChessGame({ matchId, initialFen: game.fen });

  const [rematchSent, setRematchSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Result banner animation
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
  }, [scale]);
  const bannerStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  // Rematch socket events (BUG-6)
  useEffect(() => {
    if (!socket) return;

    const onRematchOffered = (data?: { matchId: string; by?: Color }) => {
      const oppColor = data?.by === 'w' ? 'b' : 'w';
      useGameStore.getState().setRematchOffered(oppColor);
    };
    const onRematchReady = (data: {
      matchId: string;
      newMatchId: string;
      white: PlayerInfo;
      black: PlayerInfo;
      timeControl: TimeControl;
      myColor: Color;
    }) => {
      if (data.matchId !== matchId) return;
      // Server has reset the room — clear local state then navigate
      useGameStore.getState().resetGame();
      nav.replace('Game', {
        matchId: data.newMatchId,
        white: data.white,
        black: data.black,
        myColor: data.myColor,
        timeControl: data.timeControl,
      });
    };
    socket.on(SOCKET_ON.REMATCH_OFFERED, onRematchOffered);
    socket.on(SOCKET_ON.REMATCH_READY, onRematchReady);
    return () => {
      socket.off(SOCKET_ON.REMATCH_OFFERED, onRematchOffered);
      socket.off(SOCKET_ON.REMATCH_READY, onRematchReady);
    };
  }, [socket, matchId, nav]);

  const requestRematch = () => {
    setRematchSent(true);
    emit(SOCKET_EMIT.REMATCH_REQUEST, { matchId });
    setToast('Rematch requested');
  };
  const acceptRematch = () => emit(SOCKET_EMIT.REMATCH_ACCEPT, { matchId });
  const declineRematch = () => {
    emit(SOCKET_EMIT.REMATCH_DECLINE, { matchId });
    useGameStore.getState().setRematchOffered(null);
    setToast('Rematch declined');
  };
  const goHome = () => nav.reset({ index: 0, routes: [{ name: 'Main' }] });
  const goReplay = () => nav.replace('Replay', { matchId });

  const banner =
    result.kind === 'win' ? { label: 'Victory', color: COLORS.primary } :
    result.kind === 'lose' ? { label: 'Defeat', color: COLORS.danger } :
    { label: 'Draw', color: COLORS.textSecondary };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.banner, { backgroundColor: banner.color }, bannerStyle]}>
        <Text style={styles.bannerText}>{banner.label}</Text>
        <Text style={styles.bannerSub}>{prettyReason(result.reason)}</Text>
      </Animated.View>

      <View style={styles.boardWrap}>
        <Board
          pieces={chess.pieces}
          selectedSquare={null}
          legalTargets={[]}
          lastMove={chess.history[chess.history.length - 1]}
          checkSquare={null}
          flipped={game.boardFlipped}
          onSquarePress={() => {}}
          size={300}
        />
      </View>

      <MoveHistoryList moves={chess.history} />

      <View style={styles.actions}>
        {game.rematchOfferedBy ? (
          <>
            <Button label="Accept rematch" onPress={acceptRematch} style={{ flex: 1 }} />
            <View style={{ width: SPACING.sm }} />
            <Button label="Decline" variant="ghost" onPress={declineRematch} style={{ flex: 1 }} />
          </>
        ) : (
          <Button
            label={rematchSent ? 'Waiting…' : 'Rematch'}
            onPress={requestRematch}
            disabled={rematchSent}
            style={{ flex: 1 }}
          />
        )}
      </View>
      <View style={styles.actions}>
        <Button label="Review" variant="secondary" onPress={goReplay} style={{ flex: 1 }} />
        <View style={{ width: SPACING.sm }} />
        <Button label="Home" variant="ghost" onPress={goHome} style={{ flex: 1 }} />
      </View>

      <Toast message={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
};

function prettyReason(r: string): string {
  return r.replace(/_/g, ' ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.md },
  banner: {
    alignSelf: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  bannerText: { color: '#000', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  bannerSub: { color: '#000', fontSize: 12, marginTop: 2 },
  boardWrap: { alignItems: 'center', marginVertical: SPACING.md },
  actions: { flexDirection: 'row', marginTop: SPACING.sm },
});

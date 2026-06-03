// src/screens/MatchmakingScreen.tsx — joins queue, listens for match_found, navigates to Game
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Button } from '@components/Button';
import { useSocket } from '@hooks/useSocket';
import { useUserStore } from '@store/userStore';
import { TIME_CONTROLS, TIME_CONTROL_LIST } from '@/constants/timeControls';
import { SOCKET_EMIT, SOCKET_ON } from '@/constants/socketEvents';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { soundManager } from '@utils/soundManager';
import { SOUND_KEYS } from '@/constants/sounds';
import type {
  Color,
  PlayerInfo,
  TimeControl,
  TimeControlKey,
} from '@/types/index';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Matchmaking'>;

export const MatchmakingScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Matchmaking'>>();
  const { socket, emit } = useSocket();
  const user = useUserStore((s) => s.user);

  const [selected, setSelected] = useState<TimeControlKey>(
    route.params?.timeControlKey ?? 'blitz5',
  );
  const [searching, setSearching] = useState(false);

  // Pulsing ring animation
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.3, { duration: 1200, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [pulse]);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 2 - pulse.value }));

  // BUG-2 FIX: scope listener creation to this effect so removal is bulletproof
  useEffect(() => {
    if (!socket) return;

    const onMatchFound = (data: {
      matchId: string;
      white: PlayerInfo;
      black: PlayerInfo;
      timeControl: TimeControl;
    }) => {
      soundManager.play(SOUND_KEYS.GAME_START);
      const myColor: Color = user?.id === data.white.id ? 'w' : 'b';
      nav.replace('Game', {
        matchId: data.matchId,
        white: data.white,
        black: data.black,
        myColor,
        timeControl: data.timeControl,
      });
    };

    const onError = (err: { code: string; message: string }) => {
      setSearching(false);
      // Optional: surface as toast
      console.warn('Matchmaking error', err);
    };

    socket.on(SOCKET_ON.MATCH_FOUND, onMatchFound);
    socket.on(SOCKET_ON.ERROR, onError);
    return () => {
      socket.off(SOCKET_ON.MATCH_FOUND, onMatchFound);
      socket.off(SOCKET_ON.ERROR, onError);
    };
  }, [socket, nav, user]);

  const handleSearch = () => {
    if (!user) return;
    setSearching(true);
    emit(SOCKET_EMIT.JOIN_QUEUE, {
      timeControl: TIME_CONTROLS[selected],
      playerId: user.id,
    });
  };

  const handleCancel = () => {
    setSearching(false);
    emit(SOCKET_EMIT.LEAVE_QUEUE, { playerId: user?.id });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{searching ? 'Finding match…' : 'Choose time control'}</Text>

      {searching ? (
        <View style={styles.ringWrap}>
          <Animated.View style={[styles.ring, ringStyle]} />
          <View style={styles.ringCore}>
            <Text style={styles.ringText}>♟</Text>
          </View>
        </View>
      ) : (
        <View style={styles.optionsGrid}>
          {TIME_CONTROL_LIST.map((tc) => (
            <Pressable
              key={tc.key}
              onPress={() => setSelected(tc.key)}
              style={[styles.option, selected === tc.key && styles.optionActive]}
            >
              <Text style={[styles.optionText, selected === tc.key && styles.optionTextActive]}>
                {tc.label}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {searching ? (
        <Button label="Cancel" onPress={handleCancel} variant="danger" />
      ) : (
        <Button label="Find opponent" onPress={handleSearch} />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg, justifyContent: 'space-around' },
  title: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: SPACING.sm },
  option: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    minWidth: 110,
    alignItems: 'center',
  },
  optionActive: { backgroundColor: COLORS.primary },
  optionText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '500' },
  optionTextActive: { color: '#000', fontWeight: '700' },
  ringWrap: { alignItems: 'center', justifyContent: 'center', height: 200 },
  ring: { position: 'absolute', width: 160, height: 160, borderRadius: 80, borderWidth: 3, borderColor: COLORS.primary },
  ringCore: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringText: { fontSize: 50, color: COLORS.primary },
});

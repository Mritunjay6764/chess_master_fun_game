// src/screens/PlayWithFriendScreen.tsx — Create or join a private match with a room code
import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSocket } from '@hooks/useSocket';
import { useUserStore } from '@store/userStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import { SOCKET_EMIT, SOCKET_ON } from '@/constants/socketEvents';
import { TIME_CONTROL_LIST, TIME_CONTROLS } from '@/constants/timeControls';
import type { TimeControlKey } from '@/types/index';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'PlayWithFriend'>;

export const PlayWithFriendScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const { socket, emit, connected } = useSocket();
  const user = useUserStore((s) => s.user);
  const loginGuest = useUserStore((s) => s.loginGuest);

  const [tab, setTab] = useState<'create' | 'join'>('create');
  const [selectedTime, setSelectedTime] = useState<TimeControlKey>('blitz5');
  const [joinCode, setJoinCode] = useState('');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const ensureGuest = () => {
    if (!user) {
      loginGuest(`Guest${Date.now().toString(36).slice(-4).toUpperCase()}`);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const onCreated = (data: { code: string }) => {
      setRoomCode(data.code);
      setStatus('Room created! Share this code with your friend.');
      setLoading(false);
    };

    const onJoined = (data: {
      matchId: string;
      white: any;
      black: any;
      myColor: 'w' | 'b';
      timeControl: any;
    }) => {
      setLoading(false);
      nav.replace('Game', {
        matchId: data.matchId,
        white: data.white,
        black: data.black,
        myColor: data.myColor,
        timeControl: data.timeControl,
      });
    };

    const onError = (data: { message: string }) => {
      setStatus(data.message || 'Something went wrong');
      setLoading(false);
    };

    socket.on(SOCKET_ON.PRIVATE_ROOM_CREATED, onCreated);
    socket.on(SOCKET_ON.PRIVATE_ROOM_JOINED, onJoined);
    socket.on(SOCKET_ON.PRIVATE_ROOM_ERROR, onError);

    return () => {
      socket.off(SOCKET_ON.PRIVATE_ROOM_CREATED, onCreated);
      socket.off(SOCKET_ON.PRIVATE_ROOM_JOINED, onJoined);
      socket.off(SOCKET_ON.PRIVATE_ROOM_ERROR, onError);
    };
  }, [socket, nav]);

  const handleCreate = () => {
    ensureGuest();
    setLoading(true);
    setStatus('');
    setRoomCode(null);
    emit(SOCKET_EMIT.CREATE_PRIVATE, { timeControlKey: selectedTime });
  };

  const handleJoin = () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      setStatus('Enter a valid room code');
      return;
    }
    ensureGuest();
    setLoading(true);
    setStatus('');
    emit(SOCKET_EMIT.JOIN_PRIVATE, { code });
  };

  const tc = TIME_CONTROLS[selectedTime];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.tabs}>
          {(['create', 'join'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => { setTab(t); setStatus(''); setRoomCode(null); }}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'create' ? 'Create Room' : 'Join Room'}
              </Text>
            </Pressable>
          ))}
        </View>

        {tab === 'create' ? (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={28} color={COLORS.secondary} />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Create a Private Room</Text>
                <Text style={styles.cardSub}>Choose a time control and share the code</Text>
              </View>
            </View>

            <Text style={styles.label}>Time Control</Text>
            <View style={styles.timeGrid}>
              {TIME_CONTROL_LIST.map((item) => (
                <Pressable
                  key={item.key}
                  style={[styles.timeChip, selectedTime === item.key && styles.timeChipActive]}
                  onPress={() => setSelectedTime(item.key)}
                >
                  <Text style={[styles.timeChipLabel, selectedTime === item.key && styles.timeChipLabelActive]}>
                    {item.label}
                  </Text>
                  <Text style={[styles.timeChipSub, selectedTime === item.key && styles.timeChipSubActive]}>
                    {item.key.replace(/[0-9]/g, '') === 'bullet' ? '⚡' :
                     item.key.replace(/[0-9]/g, '') === 'blitz' ? '🔥' :
                     item.key.replace(/[0-9]/g, '') === 'rapid' ? '⏱' : '♟'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {roomCode ? (
              <View style={styles.codeBox}>
                <Text style={styles.codeLabel}>Room Code</Text>
                <Text style={styles.code}>{roomCode}</Text>
                <Text style={styles.codeHint}>Share this with your friend. Game starts when they join.</Text>
              </View>
            ) : (
              <Pressable
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={loading || !connected}
              >
                <Text style={styles.btnText}>{loading ? 'Creating…' : 'Create Room'}</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="enter-outline" size={28} color={COLORS.secondary} />
              <View style={styles.cardHeaderText}>
                <Text style={styles.cardTitle}>Join a Room</Text>
                <Text style={styles.cardSub}>Enter the code your friend shared</Text>
              </View>
            </View>

            <Text style={styles.label}>Room Code</Text>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. A3B7C2"
              placeholderTextColor={COLORS.textMuted}
              value={joinCode}
              onChangeText={(t) => setJoinCode(t.toUpperCase())}
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <Pressable
              style={[styles.btn, (loading || !joinCode.trim()) && styles.btnDisabled]}
              onPress={handleJoin}
              disabled={loading || !joinCode.trim() || !connected}
            >
              <Text style={styles.btnText}>{loading ? 'Joining…' : 'Join Game'}</Text>
            </Pressable>
          </View>
        )}

        {!connected && (
          <View style={styles.offlineWarn}>
            <Ionicons name="wifi-outline" size={20} color={COLORS.timerRed} />
            <Text style={styles.offlineText}>Not connected to server. Check your network.</Text>
          </View>
        )}

        {!!status && (
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>{status}</Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={20} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>
            Both players must be on the same version of the app and connected to the server. Guest play is supported.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, gap: SPACING.lg },
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: COLORS.primary },
  tabText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '700' },
  tabTextActive: { color: COLORS.onPrimary },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  cardHeaderText: { flex: 1 },
  cardTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  cardSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    minWidth: 70,
  },
  timeChipActive: {
    backgroundColor: COLORS.secondaryContainer,
    borderColor: COLORS.secondary,
  },
  timeChipLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  timeChipLabelActive: { color: COLORS.onSecondaryContainer },
  timeChipSub: { fontSize: 12, marginTop: 2 },
  timeChipSubActive: {},
  codeBox: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: COLORS.secondary,
  },
  codeLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  code: {
    color: COLORS.secondary,
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: 8,
    fontVariant: ['tabular-nums'],
  },
  codeHint: { color: COLORS.textSecondary, fontSize: 13, textAlign: 'center' },
  codeInput: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: 14,
    color: COLORS.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 6,
    textAlign: 'center',
  },
  btn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: COLORS.onPrimary, fontSize: 16, fontWeight: '700' },
  offlineWarn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.timerRed,
  },
  offlineText: { color: COLORS.timerRed, fontSize: 13, fontWeight: '600', flex: 1 },
  statusBox: {
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  statusText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  infoText: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 18, flex: 1 },
});

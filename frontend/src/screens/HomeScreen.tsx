import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { useSocket } from '@hooks/useSocket';
import { useSettingsStore } from '@store/settingsStore';
import { useUserStore } from '@store/userStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { DashboardActivityPoint, DashboardTopPlayer } from '@/types/index';
import type { RootStackParamList } from '@/navigation/types';
import type { TabParamList } from '@/navigation/types';

type HomeNav = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Play'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const HOME_ACTIONS = [
  { key: 'online', icon: '♟', title: 'Play Online', subtitle: 'Quick live matchmaking' },
  { key: 'computer', icon: '🤖', title: 'Play with Computer', subtitle: 'Practice against AI' },
  { key: 'friends', icon: '👥', title: 'Play with Friends', subtitle: 'Private room with code' },
  { key: 'rankings', icon: '🏆', title: 'Rankings', subtitle: 'Top players and stats' },
  { key: 'chat', icon: '💬', title: 'Chat', subtitle: 'Global & in-game chat' },
  { key: 'settings', icon: '⚙', title: 'Settings', subtitle: 'Audio, board, account' },
] as const;

const makeGuestName = () => `Guest${Date.now().toString(36).slice(-4).toUpperCase()}`;

const MiniChart: React.FC<{ activity: DashboardActivityPoint[] }> = ({ activity }) => {
  const max = Math.max(...activity.map((item) => item.count), 1);

  return (
    <View style={styles.chartWrap}>
      {activity.map((item) => (
        <View key={item.label} style={styles.chartItem}>
          <View style={styles.chartTrack}>
            <View
              style={[
                styles.chartBar,
                { height: `${Math.max(10, (item.count / max) * 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.chartValue}>{item.count}</Text>
          <Text style={styles.chartLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
};

const LeaderPreview: React.FC<{ players: DashboardTopPlayer[] }> = ({ players }) => (
  <View style={styles.leaderCard}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>Top players</Text>
      <Text style={styles.sectionCaption}>Live leaderboard snapshot</Text>
    </View>
    {players.length === 0 ? (
      <Text style={styles.emptyText}>Leaderboard data will appear here.</Text>
    ) : (
      players.map((player, index) => (
        <View key={player.id} style={styles.leaderRow}>
          <View style={styles.leaderLeft}>
            <Text style={styles.leaderRank}>{index + 1}</Text>
            <View style={styles.leaderAvatar}>
              <Text style={styles.leaderAvatarText}>{player.username[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View>
              <Text style={styles.leaderName}>{player.username}</Text>
              <Text style={styles.leaderRecord}>
                {player.wins}W · {player.losses}L · {player.draws}D
              </Text>
            </View>
          </View>
          <Text style={styles.leaderRating}>{player.rating}</Text>
        </View>
      ))
    )}
  </View>
);

export const HomeScreen: React.FC = () => {
  const nav = useNavigation<HomeNav>();
  const user = useUserStore((s) => s.user);
  const loginGuest = useUserStore((s) => s.loginGuest);
  const soundEnabled = useSettingsStore((s) => s.soundEnabled);
  const setSoundEnabled = useSettingsStore((s) => s.setSoundEnabled);
  const { connected, onlineCount } = useSocket();

  const dashboardQuery = useQuery({
    queryKey: ['guest-home-dashboard'],
    queryFn: async () => {
      const { GameApi } = await import('@api/client');
      const res = await GameApi.dashboard();
      return res.data;
    },
    staleTime: 30_000,
  });

  const ensureGuest = () => {
    if (!user) {
      loginGuest(makeGuestName());
    }
  };

  const handleCardPress = (key: (typeof HOME_ACTIONS)[number]['key']) => {
    switch (key) {
      case 'online':
        ensureGuest();
        nav.navigate('Matchmaking');
        return;
      case 'computer':
        nav.navigate('SinglePlayer');
        return;
      case 'friends':
        ensureGuest();
        nav.navigate('PlayWithFriend');
        return;
      case 'rankings':
        nav.navigate('Leaderboard');
        return;
      case 'chat':
        nav.navigate('Chat');
        return;
      case 'settings':
        nav.navigate('Settings');
        return;
    }
  };

  const summary = dashboardQuery.data?.summary;
  const activity = dashboardQuery.data?.activity ?? [];
  const topPlayers = dashboardQuery.data?.topPlayers ?? [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.brand}>♟ Chess</Text>
            <View style={[styles.livePill, connected && styles.livePillActive]}>
              <View style={[styles.liveDot, connected && styles.liveDotActive]} />
              <Text style={styles.livePillText}>
                {connected ? `${onlineCount} online` : 'Offline'}
              </Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.iconButton} onPress={() => setSoundEnabled(!soundEnabled)}>
              <Text style={styles.iconButtonText}>{soundEnabled ? '🔊' : '🔇'}</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => nav.navigate('Settings')}>
              <Text style={styles.iconButtonText}>⚙</Text>
            </Pressable>
          </View>
        </View>

        {/* ── Auth prompt for guests ── */}
        {(!user || user.isGuest) && (
          <View style={styles.guestBanner}>
            <View style={styles.guestBannerLeft}>
              <Text style={styles.guestBannerTitle}>
                {user?.isGuest ? `Hi, ${user.username} 👋` : 'Play instantly'}
              </Text>
              <Text style={styles.guestBannerSub}>
                {user?.isGuest
                  ? 'Create an account to save your rating'
                  : 'No account needed — jump right in'}
              </Text>
            </View>
            <View style={styles.guestBannerBtns}>
              <Pressable style={styles.guestBtnPrimary} onPress={() => nav.navigate('Auth', { initialMode: 'register' })}>
                <Text style={styles.guestBtnPrimaryText}>Sign up</Text>
              </Pressable>
              <Pressable style={styles.guestBtnSecondary} onPress={() => nav.navigate('Auth', { initialMode: 'signin' })}>
                <Text style={styles.guestBtnSecondaryText}>Login</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Quick actions 2×3 grid ── */}
        <View style={styles.cardGrid}>
          {HOME_ACTIONS.map((item) => (
            <Pressable
              key={item.key}
              style={styles.actionCard}
              onPress={() => handleCardPress(item.key)}
            >
              <Text style={styles.actionIcon}>{item.icon}</Text>
              <Text style={styles.actionTitle}>{item.title}</Text>
              <Text style={styles.actionSubtitle}>{item.subtitle}</Text>
            </Pressable>
          ))}
        </View>

        {/* ── Live stats row ── */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary?.currentlyPlaying ?? '—'}</Text>
            <Text style={styles.statLabel}>Playing now</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary?.playersSearching ?? '—'}</Text>
            <Text style={styles.statLabel}>In queue</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{summary?.registeredPlayers ?? '—'}</Text>
            <Text style={styles.statLabel}>Players</Text>
          </View>
        </View>

        {/* ── Activity chart ── */}
        {(dashboardQuery.isLoading || activity.length > 0) && (
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            {dashboardQuery.isLoading ? (
              <ActivityIndicator color={COLORS.secondary} style={{ marginVertical: 20 }} />
            ) : (
              <MiniChart activity={activity} />
            )}
          </View>
        )}

        {/* ── Top players ── */}
        <LeaderPreview players={topPlayers} />

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl },
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  headerLeft: { flexDirection: 'column', gap: 4 },
  brand: {
    color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.5,
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  livePillActive: { backgroundColor: '#E8F7EE' },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: COLORS.textMuted },
  liveDotActive: { backgroundColor: COLORS.timerGreen },
  livePillText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: SPACING.sm },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonText: { fontSize: 18 },
  // Guest banner
  guestBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border,
  },
  guestBannerLeft: { flex: 1, marginRight: SPACING.sm },
  guestBannerTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  guestBannerSub: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  guestBannerBtns: { flexDirection: 'row', gap: SPACING.xs },
  guestBtnPrimary: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.sm,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  guestBtnPrimaryText: { color: COLORS.onPrimary, fontSize: 12, fontWeight: '700' },
  guestBtnSecondary: {
    backgroundColor: 'transparent', borderRadius: RADIUS.sm,
    paddingVertical: 7, paddingHorizontal: 12,
    borderWidth: 1, borderColor: COLORS.border,
  },
  guestBtnSecondaryText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  statCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center',
  },
  statValue: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', marginTop: 2 },
  chartCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border, marginBottom: SPACING.md,
  },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: SPACING.sm },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.sm,
  },
  sectionCaption: { color: COLORS.textMuted, fontSize: 11, fontWeight: '500' },
  chartWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 180,
    gap: SPACING.sm,
  },
  chartItem: {
    flex: 1,
    alignItems: 'center',
  },
  chartTrack: {
    width: '100%',
    maxWidth: 28,
    height: 120,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 20,
    justifyContent: 'flex-end',
    padding: 4,
  },
  chartBar: {
    width: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    minHeight: 10,
  },
  chartValue: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  chartLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 4,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 138,
  },
  actionIcon: { fontSize: 24, marginBottom: 12 },
  actionTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  actionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 18,
  },
  leaderCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: 13 },
  leaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceVariant,
  },
  leaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  leaderRank: {
    width: 24,
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  leaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaderAvatarText: { color: COLORS.textPrimary, fontWeight: '700' },
  leaderName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  leaderRecord: { color: COLORS.textSecondary, fontSize: 12, marginTop: 2 },
  leaderRating: { color: COLORS.secondary, fontSize: 16, fontWeight: '800' },
});

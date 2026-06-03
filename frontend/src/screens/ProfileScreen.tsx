// src/screens/ProfileScreen.tsx — player dashboard with stats and game history
import React, { useState } from 'react';
import {
  ActivityIndicator, FlatList, Pressable,
  StyleSheet, Text, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { GameApi, AuthApi } from '@api/client';
import { useUserStore } from '@store/userStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

type Nav = import('@react-navigation/native-stack').NativeStackNavigationProp<
  import('@/navigation/types').RootStackParamList
>;

const getTier = (elo: number) => {
  if (elo >= 2000) return { label: 'Grandmaster', color: '#B9E4FF', icon: '👑' };
  if (elo >= 1800) return { label: 'Diamond',     color: '#B9E4FF', icon: '💎' };
  if (elo >= 1600) return { label: 'Platinum',    color: '#C7F0E0', icon: '🏅' };
  if (elo >= 1400) return { label: 'Gold',        color: '#FFD770', icon: '⭐' };
  if (elo >= 1200) return { label: 'Silver',      color: '#D0D0D0', icon: '🥈' };
  return                  { label: 'Bronze',      color: '#C88B5A', icon: '🥉' };
};

const formatResult = (r: string) => {
  if (r === 'win')  return { label: 'Win',  color: COLORS.secondary };
  if (r === 'loss') return { label: 'Loss', color: '#D35858' };
  return                   { label: 'Draw', color: COLORS.textMuted };
};

export const ProfileScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);
  const logout = useUserStore((s) => s.logout);
  const [tab, setTab] = useState<'stats' | 'history'>('stats');

  const statsQuery = useQuery({
    queryKey: ['stats', user?.id],
    queryFn: () => GameApi.stats(user!.id).then((r) => r.data),
    enabled: !!user && !user.isGuest,
  });

  const historyQuery = useInfiniteQuery({
    queryKey: ['history', user?.id],
    enabled: !!user && !user.isGuest,
    initialPageParam: 1,
    queryFn: ({ pageParam = 1 }) =>
      GameApi.history(user!.id, pageParam as number).then((r) => r.data),
    getNextPageParam: (last, all) =>
      Array.isArray(last) && last.length === 20 ? all.length + 1 : undefined,
  });

  if (!user) return null;

  const stats = statsQuery.data;
  const games = historyQuery.data?.pages.flatMap((p) => p) ?? [];
  const total = (stats?.wins ?? 0) + (stats?.losses ?? 0) + (stats?.draws ?? 0);
  const winPct = total > 0 ? Math.round(((stats?.wins ?? 0) / total) * 100) : 0;
  const tier = getTier(user.rating);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="arrow-back" size={20} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Profile</Text>
        <Pressable onPress={logout} style={styles.logoutBtn} hitSlop={10}>
          <Ionicons name="log-out-outline" size={20} color={COLORS.textSecondary} />
        </Pressable>
      </View>

      {/* Avatar + info */}
      <View style={styles.heroCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>{user.username[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View style={styles.tierBadge}>
            <Text style={styles.tierIcon}>{tier.icon}</Text>
          </View>
        </View>
        <View style={styles.heroInfo}>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={[styles.tierLabel, { color: tier.color }]}>{tier.label}</Text>
          <View style={styles.ratingRow}>
            <Text style={styles.ratingNum}>{user.rating}</Text>
            <Text style={styles.ratingLabel}> ELO</Text>
          </View>
        </View>
      </View>

      {/* Guest CTA */}
      {user.isGuest && (
        <View style={styles.guestBox}>
          <Text style={styles.guestText}>Playing as guest — stats not saved</Text>
          <Pressable
            style={styles.guestCta}
            onPress={() => nav.navigate('Auth', { initialMode: 'register' })}
          >
            <Text style={styles.guestCtaText}>Create account →</Text>
          </Pressable>
        </View>
      )}

      {/* Tab switcher */}
      {!user.isGuest && (
        <View style={styles.tabRow}>
          {(['stats', 'history'] as const).map((t) => (
            <Pressable
              key={t}
              style={[styles.tab, tab === t && styles.tabActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t === 'stats' ? 'Stats' : 'Games'}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Stats tab */}
      {tab === 'stats' && !user.isGuest && (
        statsQuery.isLoading ? (
          <ActivityIndicator color={COLORS.secondary} style={{ marginTop: 40 }} />
        ) : (
          <View style={styles.statsGrid}>
            <StatCard label="Wins" value={String(stats?.wins ?? 0)} color={COLORS.secondary} />
            <StatCard label="Losses" value={String(stats?.losses ?? 0)} color="#D35858" />
            <StatCard label="Draws" value={String(stats?.draws ?? 0)} color={COLORS.textMuted} />
            <StatCard label="Win %" value={`${winPct}%`} color={COLORS.primary} />
            <StatCard
              label="Avg game"
              value={stats?.avgGameLengthMs
                ? `${Math.round(stats.avgGameLengthMs / 60000)}m`
                : '—'}
            />
            <StatCard label="Games" value={String(total)} />
          </View>
        )
      )}

      {/* History tab */}
      {tab === 'history' && !user.isGuest && (
        historyQuery.isLoading ? (
          <ActivityIndicator color={COLORS.secondary} style={{ marginTop: 40 }} />
        ) : games.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>♟</Text>
            <Text style={styles.emptyText}>No games yet. Start playing!</Text>
          </View>
        ) : (
          <FlatList
            data={games}
            keyExtractor={(g, i) => `${(g as any).id ?? i}`}
            contentContainerStyle={styles.historyList}
            onEndReached={() => historyQuery.hasNextPage && historyQuery.fetchNextPage()}
            onEndReachedThreshold={0.4}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={
              historyQuery.isFetchingNextPage
                ? <ActivityIndicator color={COLORS.primary} style={{ margin: 16 }} />
                : null
            }
            renderItem={({ item }: { item: any }) => {
              const result = formatResult(item.result ?? '');
              const opponentName = item.opponent?.username ?? item.opponent ?? 'Unknown';
              const side = item.isWhite ? 'White' : 'Black';
              return (
                <View style={styles.gameRow}>
                  <View style={styles.gameLeft}>
                    <View style={[styles.resultDot, { backgroundColor: result.color }]} />
                    <View>
                      <Text style={styles.gameOpp}>vs {opponentName}</Text>
                      <Text style={styles.gameSide}>Playing {side}</Text>
                    </View>
                  </View>
                  <View style={styles.gameRight}>
                    <Text style={[styles.gameResult, { color: result.color }]}>{result.label}</Text>
                    {item.completedAt && (
                      <Text style={styles.gameDate}>
                        {new Date(item.completedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              );
            }}
          />
        )
      )}
    </SafeAreaView>
  );
};

const StatCard: React.FC<{ label: string; value: string; color?: string }> = ({
  label, value, color,
}) => (
  <View style={styles.statCard}>
    <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  logoutBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.surfaceContainerHigh,
  },

  heroCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    padding: SPACING.lg, margin: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.primary,
  },
  avatarLetter: { color: COLORS.textPrimary, fontSize: 32, fontWeight: '800' },
  tierBadge: {
    position: 'absolute', bottom: -4, right: -4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.background,
  },
  tierIcon: { fontSize: 14 },
  heroInfo: { flex: 1 },
  username: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },
  tierLabel: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 6 },
  ratingNum: { color: COLORS.secondary, fontSize: 28, fontWeight: '800' },
  ratingLabel: { color: COLORS.textMuted, fontSize: 13 },

  guestBox: {
    marginHorizontal: SPACING.md, padding: SPACING.md,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  guestText: { color: COLORS.textSecondary, fontSize: 13 },
  guestCta: {},
  guestCtaText: { color: COLORS.primary, fontSize: 13, fontWeight: '700' },

  tabRow: {
    flexDirection: 'row', marginHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: RADIUS.md, padding: 3,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: RADIUS.sm },
  tabActive: { backgroundColor: COLORS.surface },
  tabText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },
  tabTextActive: { color: COLORS.textPrimary },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    padding: SPACING.sm, gap: SPACING.sm,
    paddingHorizontal: SPACING.md, marginTop: SPACING.sm,
  },
  statCard: {
    width: '30%', flex: 1,
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.border, minWidth: 90,
  },
  statValue: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' },
  statLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },

  historyList: { padding: SPACING.md, gap: SPACING.xs },
  gameRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: RADIUS.md,
    padding: SPACING.md, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.xs,
  },
  gameLeft: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  resultDot: { width: 10, height: 10, borderRadius: 5 },
  gameOpp: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  gameSide: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  gameRight: { alignItems: 'flex-end' },
  gameResult: { fontSize: 13, fontWeight: '700' },
  gameDate: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: COLORS.textSecondary, fontSize: 14 },
});

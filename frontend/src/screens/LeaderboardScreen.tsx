import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '@store/userStore';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';

interface LeaderboardPlayer {
  id: string;
  username: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  title?: string;
  flag?: string;
}

const FLAGS: Record<string, string> = {
  'player1': '🇮🇳', 'player2': '🇨🇳', 'player3': '🇺🇸',
  'player4': '🇳🇴', 'player5': '🇷🇺', 'player6': '🇬🇧',
  'player7': '🇫🇷', 'player8': '🇩🇪', 'player9': '🇪🇸',
  'player10': '🇧🇷',
};

const TITLES = [
  'Grandmaster', 'Grandmaster', 'Grandmaster',
  'International Master', 'Grandmaster', 'FIDE Master',
  'Grandmaster', 'International Master', 'Grandmaster', 'Candidate Master',
];

type Tier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
const getTier = (elo: number): { label: Tier; color: string; bg: string } => {
  if (elo >= 1800) return { label: 'Diamond',  color: '#B9E4FF', bg: '#1A3A4A' };
  if (elo >= 1600) return { label: 'Platinum', color: '#C7F0E0', bg: '#0B3B2A' };
  if (elo >= 1400) return { label: 'Gold',     color: '#FFD770', bg: '#3A2800' };
  if (elo >= 1200) return { label: 'Silver',   color: '#D0D0D0', bg: '#2A2A2A' };
  return                  { label: 'Bronze',   color: '#C88B5A', bg: '#2E1800' };
};

export const LeaderboardScreen: React.FC = () => {
  const user = useUserStore((s) => s.user);
  const [search, setSearch] = useState('');

  const { data, isLoading, isError } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const { LeaderboardApi } = await import('@api/client');
      const res = await LeaderboardApi.top(100);
      return res.data.players;
    },
  });

  const allPlayers: LeaderboardPlayer[] = React.useMemo(() => {
    const base: LeaderboardPlayer[] = (data ?? []).map((p: any, i: number) => ({
      id: p.id ?? `player_${i}`,
      username: p.username ?? `Player ${i + 1}`,
      elo: p.elo ?? p.rating ?? 1200,
      wins: p.wins ?? 0,
      losses: p.losses ?? 0,
      draws: p.draws ?? 0,
      flag: FLAGS[p.id] ?? FLAGS[`player${(i % 10) + 1}`] ?? '🇺🇳',
      title: TITLES[i % TITLES.length],
    }));
    if (!user) return base;
    const userEntry: LeaderboardPlayer = {
      id: user.id,
      username: user.username,
      elo: user.rating,
      wins: 0,
      losses: 0,
      draws: 0,
      title: user.isGuest ? 'Guest' : 'Candidate Master',
      flag: '🇬🇧',
    };
    return [...base, userEntry];
  }, [data, user]);

  const filtered = React.useMemo(
    () => allPlayers.filter((p) =>
      p.username.toLowerCase().includes(search.toLowerCase()),
    ),
    [allPlayers, search],
  );

  const podium = filtered.slice(0, 3);

  const renderPlayer = ({ item, index }: { item: LeaderboardPlayer; index: number }) => {
    const isUser = !user?.isGuest && item.id === user?.id;
    const rank = index + 1;
    const tier = getTier(item.elo);

    return (
      <View style={[styles.playerRow, isUser && styles.playerRowUser]}>
        <View style={styles.playerLeft}>
          <Text style={[styles.rankNum, rank <= 3 && styles.rankMedal, isUser && styles.rankNumUser]}>
            {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
          </Text>
          <View style={[styles.playerAvatar, isUser && styles.playerAvatarUser]}>
            <Text style={styles.playerAvatarText}>{item.username[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <View>
            <View style={styles.playerNameRow}>
              <Text style={[styles.playerName, isUser && styles.playerNameUser]}>{item.username}</Text>
              <Text style={styles.playerFlag}>{item.flag ?? ''}</Text>
            </View>
            <View style={styles.tierRow}>
              <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
                <Text style={[styles.tierText, { color: tier.color }]}>{tier.label}</Text>
              </View>
              <Text style={[styles.playerTitle, isUser && styles.playerTitleUser]}>{item.title ?? 'Player'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.playerRight}>
          <Text style={[styles.playerElo, isUser && styles.playerEloUser]}>{item.elo}</Text>
          <Text style={styles.eloLabel}>ELO</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={COLORS.secondary} size="large" />
        </View>
      ) : isError ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>Failed to load leaderboard</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={() => (
            <>
              {/* Podium */}
              <View style={styles.podiumRow}>
                {podium.length >= 2 && (
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, { borderColor: COLORS.primary }]}>
                      <Text style={styles.podiumAvatarText}>{podium[1].username[0]}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{podium[1].username}</Text>
                    <Text style={styles.podiumElo}>{podium[1].elo} ELO</Text>
                    <View style={styles.podiumPedestal}>
                      <Text style={styles.podiumRankText}>2nd</Text>
                    </View>
                  </View>
                )}
                {podium.length >= 1 && (
                  <View style={[styles.podiumItem, styles.podiumItemFirst]}>
                    <View style={[styles.podiumAvatar, styles.podiumAvatarFirst, { borderColor: COLORS.secondary }]}>
                      <Text style={[styles.podiumAvatarText, styles.podiumAvatarTextFirst]}>
                        {podium[0].username[0]}
                      </Text>
                    </View>
                    <View style={styles.trophyBadge}>
                      <Text style={styles.trophyIcon}>🏆</Text>
                    </View>
                    <Text style={[styles.podiumName, styles.podiumNameFirst]} numberOfLines={1}>{podium[0].username}</Text>
                    <Text style={[styles.podiumElo, styles.podiumEloFirst]}>{podium[0].elo} ELO</Text>
                    <View style={[styles.podiumPedestal, styles.podiumPedestalFirst]}>
                      <Text style={[styles.podiumRankText, styles.podiumRankTextFirst]}>1st</Text>
                    </View>
                  </View>
                )}
                {podium.length >= 3 && (
                  <View style={styles.podiumItem}>
                    <View style={[styles.podiumAvatar, { borderColor: COLORS.textMuted }]}>
                      <Text style={styles.podiumAvatarText}>{podium[2].username[0]}</Text>
                    </View>
                    <Text style={styles.podiumName} numberOfLines={1}>{podium[2].username}</Text>
                    <Text style={styles.podiumElo}>{podium[2].elo} ELO</Text>
                    <View style={[styles.podiumPedestal, styles.podiumPedestalThird]}>
                      <Text style={styles.podiumRankText}>3rd</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Search */}
              <View style={styles.searchRow}>
                <Text style={styles.searchTitle}>Global Rankings</Text>
                <View style={styles.searchInputWrap}>
                  <Text style={styles.searchIcon}>🔍</Text>
                  <TextInput
                    placeholder="Search players..."
                    placeholderTextColor={COLORS.outlineVariant}
                    value={search}
                    onChangeText={setSearch}
                    style={styles.searchInput}
                  />
                </View>
              </View>
            </>
          )}
          renderItem={renderPlayer}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { color: COLORS.danger, fontSize: 14 },
  listContent: { paddingHorizontal: 24, paddingBottom: 32 },

  podiumRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    gap: 12, marginTop: 24, marginBottom: 32,
  },
  podiumItem: { flex: 1, alignItems: 'center' },
  podiumItemFirst: { flex: 1.3 },
  podiumAvatar: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, backgroundColor: COLORS.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  podiumAvatarFirst: { width: 88, height: 88, borderRadius: 44, borderWidth: 2 },
  podiumAvatarText: { fontSize: 24, fontWeight: '700', color: COLORS.primary },
  podiumAvatarTextFirst: { fontSize: 32, color: COLORS.secondary },
  trophyBadge: {
    position: 'absolute', top: -4, right: 4,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: COLORS.surfaceBright, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: COLORS.secondary,
  },
  trophyIcon: { fontSize: 14 },
  podiumName: { fontSize: 12, fontWeight: '600', color: COLORS.primary, textAlign: 'center' },
  podiumNameFirst: { fontSize: 14, color: COLORS.secondary },
  podiumElo: { fontSize: 10, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 8, letterSpacing: 1 },
  podiumEloFirst: { color: COLORS.secondary },
  podiumPedestal: {
    width: '100%', height: 64,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderTopLeftRadius: RADIUS.md, borderTopRightRadius: RADIUS.md,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
  },
  podiumPedestalFirst: {
    height: 96,
    backgroundColor: 'rgba(149,211,186,0.1)',
    borderTopWidth: 2, borderTopColor: COLORS.secondary,
  },
  podiumPedestalThird: { height: 48 },
  podiumRankText: {
    fontFamily: 'Georgia', fontSize: 20, fontWeight: '600',
    color: COLORS.primary, opacity: 0.3, fontStyle: 'italic',
  },
  podiumRankTextFirst: { fontSize: 24, color: COLORS.secondary },

  searchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, borderBottomWidth: 1,
    borderBottomColor: 'rgba(68,71,77,0.15)', paddingBottom: 16,
  },
  searchTitle: { fontFamily: 'Georgia', fontSize: 18, fontWeight: '500', color: COLORS.textPrimary },
  searchInputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.md,
    paddingHorizontal: 12, borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant, flex: 1, maxWidth: 200, marginLeft: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: COLORS.textPrimary, fontSize: 13, paddingVertical: 10 },

  playerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, marginBottom: 6, backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
  },
  playerRowUser: {
    backgroundColor: 'rgba(11,81,61,0.1)',
    borderLeftWidth: 4, borderLeftColor: COLORS.secondary,
  },
  playerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rankNum: { width: 24, fontSize: 14, fontWeight: '600', color: COLORS.textSecondary, textAlign: 'center' },
  rankMedal: { fontSize: 18 },
  rankNumUser: { color: COLORS.secondary },
  playerAvatar: {
    width: 40, height: 40, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceContainerHigh, alignItems: 'center',
    justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(68,71,77,0.2)',
  },
  playerAvatarUser: { backgroundColor: COLORS.secondaryContainer, borderColor: 'rgba(149,211,186,0.3)' },
  playerAvatarText: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  playerName: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '600' },
  playerNameUser: { color: COLORS.secondary },
  playerFlag: { fontSize: 11 },
  playerTitle: { fontSize: 9, letterSpacing: 0.5, color: COLORS.textSecondary, textTransform: 'uppercase' },
  playerTitleUser: { color: 'rgba(149,211,186,0.7)' },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  tierBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tierText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5, textTransform: 'uppercase' },
  playerRight: { alignItems: 'flex-end' },
  playerElo: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  playerEloUser: { color: COLORS.secondary },
  eloLabel: { fontSize: 9, color: COLORS.textMuted, letterSpacing: 0.5, textTransform: 'uppercase', marginTop: 1 },
});

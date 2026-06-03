// src/components/PlayerInfoBar.tsx — opponent/self info row (avatar, rating, captured, timer)
import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { CapturedRow } from '@components/CapturedRow/CapturedRow';
import { CircularTimer } from '@components/Timer/CircularTimer';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { Color, PlayerInfo } from '@/types/index';

interface Props {
  player: PlayerInfo;
  side: Color; // which side this bar represents
  timeMs: number;
  totalSeconds: number;
  active: boolean;
  captures: string[];
  advantage: number;
}

export const PlayerInfoBar: React.FC<Props> = ({
  player,
  side,
  timeMs,
  totalSeconds,
  active,
  captures,
  advantage,
}) => (
  <View style={styles.row}>
    <View style={styles.left}>
      {player.avatarUrl ? (
        <Image source={{ uri: player.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>{player.username[0]?.toUpperCase() ?? '?'}</Text>
        </View>
      )}
      <View style={styles.identity}>
        <Text style={styles.username} numberOfLines={1}>
          {player.username}
        </Text>
        <Text style={styles.rating}>{player.rating} • {side === 'w' ? 'White' : 'Black'}</Text>
        <CapturedRow
          captures={captures}
          // Pieces captured BY this side are pieces of the OPPOSITE color
          capturedColor={side === 'w' ? 'b' : 'w'}
          advantage={advantage}
        />
      </View>
    </View>
    <CircularTimer remainingMs={timeMs} totalSeconds={totalSeconds} active={active} />
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    marginVertical: SPACING.xs,
  },
  left: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.sm },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surfaceAlt },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: COLORS.textPrimary, fontWeight: '700' },
  identity: { flex: 1, gap: 2 },
  username: { color: COLORS.textPrimary, fontWeight: '600', fontSize: 14 },
  rating: { color: COLORS.textSecondary, fontSize: 11 },
});

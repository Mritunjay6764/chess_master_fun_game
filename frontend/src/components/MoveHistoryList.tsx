// src/components/MoveHistoryList.tsx — virtualized SAN move list
import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { ChessMove } from '@/types/index';

interface Props {
  moves: ChessMove[];
}

interface Pair {
  index: number;
  white?: string;
  black?: string;
}

export const MoveHistoryList: React.FC<Props> = ({ moves }) => {
  const pairs = useMemo<Pair[]>(() => {
    const result: Pair[] = [];
    for (let i = 0; i < moves.length; i += 2) {
      result.push({
        index: i / 2 + 1,
        white: moves[i]?.san,
        black: moves[i + 1]?.san,
      });
    }
    return result;
  }, [moves]);

  return (
    <View style={styles.list}>
      <View style={styles.content}>
        {pairs.map((item) => (
        <View key={`m-${item.index}`} style={styles.row}>
          <Text style={styles.index}>{item.index}.</Text>
          <Text style={styles.move}>{item.white ?? ''}</Text>
          <Text style={styles.move}>{item.black ?? ''}</Text>
        </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  list: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, maxHeight: 200 },
  content: { paddingVertical: SPACING.sm },
  row: { flexDirection: 'row', paddingHorizontal: SPACING.md, paddingVertical: 4 },
  index: { color: COLORS.textMuted, width: 32, fontSize: 12 },
  move: { color: COLORS.textPrimary, flex: 1, fontSize: 13, fontFamily: 'Menlo' },
});

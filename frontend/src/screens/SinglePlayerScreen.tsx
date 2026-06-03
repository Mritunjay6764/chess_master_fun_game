// src/screens/SinglePlayerScreen.tsx — Single player vs AI mode
import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@components/Button';
import { useUserStore } from '@store/userStore';
import { TIME_CONTROLS, TIME_CONTROL_LIST } from '@/constants/timeControls';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { Color, TimeControl, TimeControlKey } from '@/types/index';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const DIFFICULTIES = [
  { level: 1, label: 'Beginner' },
  { level: 3, label: 'Easy' },
  { level: 5, label: 'Medium' },
  { level: 7, label: 'Hard' },
  { level: 10, label: 'Grandmaster' },
];

const COLORS_OPTIONS: { color: Color; label: string }[] = [
  { color: 'w', label: 'White' },
  { color: 'b', label: 'Black' },
];

export const SinglePlayerScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const user = useUserStore((s) => s.user);

  const [difficulty, setDifficulty] = useState(5);
  const [myColor, setMyColor] = useState<Color>('w');
  const [timeControl, setTimeControl] = useState<TimeControlKey>('blitz5');

  const handleStart = () => {
    const tc = TIME_CONTROLS[timeControl];
    const aiPlayer: import('@/types/index').PlayerInfo = {
      id: 'ai',
      username: `AI (${DIFFICULTIES.find((d) => d.level === difficulty)?.label ?? 'Medium'})`,
      rating: 1200 + difficulty * 100,
    };
    const humanPlayer: import('@/types/index').PlayerInfo = {
      id: user?.id ?? 'guest',
      username: user?.username ?? 'You',
      rating: user?.rating ?? 1200,
    };

    // matchId format: ai-{timestamp}-{difficulty}
    nav.navigate('Game', {
      matchId: `ai-${Date.now()}-${difficulty}`,
      white: myColor === 'w' ? humanPlayer : aiPlayer,
      black: myColor === 'b' ? humanPlayer : aiPlayer,
      myColor,
      timeControl: { ...tc, key: timeControl },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Play vs Computer</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Difficulty</Text>
        <View style={styles.optionsRow}>
          {DIFFICULTIES.map((d) => (
            <Pressable
              key={d.level}
              onPress={() => setDifficulty(d.level)}
              style={[styles.optionPill, difficulty === d.level && styles.optionActive]}
            >
              <Text style={[styles.optionText, difficulty === d.level && styles.optionTextActive]}>
                {d.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Play as</Text>
        <View style={styles.optionsRow}>
          {COLORS_OPTIONS.map((c) => (
            <Pressable
              key={c.color}
              onPress={() => setMyColor(c.color)}
              style={[styles.colorOption, myColor === c.color && styles.optionActive]}
            >
              <Text style={[styles.colorText, myColor === c.color && styles.optionTextActive]}>
                {c.color === 'w' ? '♔ White' : '♚ Black'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Time control</Text>
        <View style={styles.optionsGrid}>
          {TIME_CONTROL_LIST.map((tc) => (
            <Pressable
              key={tc.key}
              onPress={() => setTimeControl(tc.key)}
              style={[styles.tcOption, timeControl === tc.key && styles.optionActive]}
            >
              <Text style={[styles.tcText, timeControl === tc.key && styles.optionTextActive]}>
                {tc.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Start Game" onPress={handleStart} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.lg },
  title: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '700', textAlign: 'center', marginBottom: SPACING.xl },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600', marginBottom: SPACING.sm },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  optionPill: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    minWidth: 90,
    alignItems: 'center',
  },
  colorOption: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    flex: 1,
    alignItems: 'center',
  },
  tcOption: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.sm,
    minWidth: 90,
    alignItems: 'center',
  },
  optionActive: { backgroundColor: COLORS.primary },
  optionText: { color: COLORS.textPrimary, fontSize: 13, fontWeight: '500' },
  optionTextActive: { color: '#000', fontWeight: '700' },
  colorText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  tcText: { color: COLORS.textPrimary, fontSize: 12, fontWeight: '500' },
  footer: { marginTop: 'auto', paddingTop: SPACING.lg },
});
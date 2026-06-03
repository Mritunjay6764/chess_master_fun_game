// src/screens/SettingsScreen.tsx — toggles persisted via MMKV (settingsStore)
import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserStore } from '@store/userStore';
import { useSettingsStore } from '@store/settingsStore';
import { Button } from '@components/Button';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { BoardThemeKey, PieceThemeKey } from '@/types/index';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';

const BOARD_OPTIONS: { key: BoardThemeKey; label: string; dark: string; light: string }[] = [
  { key: 'classic', label: 'Classic', dark: '#B58863', light: '#F0D9B5' },
  { key: 'green',   label: 'Green',   dark: '#4A7C59', light: '#EEEED2' },
  { key: 'blue',    label: 'Blue',    dark: '#4682B4', light: '#EEF3FF' },
];
const PIECE_OPTIONS: { key: PieceThemeKey; label: string }[] = [
  { key: 'merida', label: 'Merida' },
  { key: 'alpha',  label: 'Alpha' },
  { key: 'neo',    label: 'Neo' },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const SettingsScreen: React.FC = () => {
  const s = useSettingsStore();
  const user = useUserStore((u) => u.user);
  const logout = useUserStore((u) => u.logout);
  const nav = useNavigation<Nav>();

  const handleLogout = () => {
    Alert.alert(
      user?.isGuest ? 'Clear session' : 'Log out',
      user?.isGuest ? 'This will clear your guest session.' : 'You will be logged out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: user?.isGuest ? 'Clear' : 'Log out',
          style: 'destructive',
          onPress: () => {
            logout();
            nav.reset({ index: 0, routes: [{ name: 'Main' }] });
          },
        },
      ],
    );
  };

  const handleResetSettings = () => {
    Alert.alert('Reset settings', 'Restore all settings to defaults?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: s.reset },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>

      <Section title="Audio" icon="volume-high-outline">
        <Row
          label="Game sounds"
          value={<Switch
            value={s.soundEnabled}
            onValueChange={s.setSoundEnabled}
            trackColor={{ true: COLORS.primary }}
          />}
        />
        <Row
          label={`Volume — ${Math.round(s.volume * 100)}%`}
          value={
            <View style={styles.stepRow}>
              <StepBtn icon="remove" onPress={() => s.setVolume(s.volume - 0.1)} />
              <View style={styles.volBar}>
                <View style={[styles.volFill, { width: `${s.volume * 100}%` }]} />
              </View>
              <StepBtn icon="add" onPress={() => s.setVolume(s.volume + 0.1)} />
            </View>
          }
        />
      </Section>

      <Section title="Haptics" icon="phone-portrait-outline">
        <Row
          label="Vibration feedback"
          value={<Switch value={s.hapticsEnabled} onValueChange={s.setHapticsEnabled} trackColor={{ true: COLORS.primary }} />}
        />
      </Section>

      <Section title="Board theme" icon="grid-outline">
        <View style={styles.themeGrid}>
          {BOARD_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => s.setBoardTheme(o.key)}
              style={[styles.boardThemeCard, s.boardTheme === o.key && styles.boardThemeCardActive]}
            >
              <View style={styles.boardPreview}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.boardSquare, { backgroundColor: i % 2 === 0 ? o.dark : o.light }]} />
                ))}
              </View>
              <Text style={[styles.themeLabel, s.boardTheme === o.key && styles.themeLabelActive]}>{o.label}</Text>
              {s.boardTheme === o.key && (
                <Ionicons name="checkmark-circle" size={16} color={COLORS.secondary} style={styles.checkIcon} />
              )}
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Piece theme" icon="apps-outline">
        <View style={styles.chipRow}>
          {PIECE_OPTIONS.map((o) => (
            <Pressable
              key={o.key}
              onPress={() => s.setPieceTheme(o.key)}
              style={[styles.chip, s.pieceTheme === o.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, s.pieceTheme === o.key && styles.chipTextActive]}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
      </Section>

      <Section title="Gameplay" icon="game-controller-outline">
        <Row
          label="Show legal move hints"
          value={<Switch value={s.showLegalMoves} onValueChange={s.setShowLegalMoves} trackColor={{ true: COLORS.primary }} />}
        />
        <Row
          label="Highlight last move"
          value={<Switch value={s.showLastMove} onValueChange={s.setShowLastMove} trackColor={{ true: COLORS.primary }} />}
        />
      </Section>

      <Section title="Account" icon="person-outline">
        {user ? (
          <Pressable style={styles.accountCard} onPress={() => nav.navigate('Profile')}>
            <View style={styles.accountAvatar}>
              <Text style={styles.accountAvatarText}>{user.username[0]?.toUpperCase() ?? '?'}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{user.username}</Text>
              <Text style={styles.accountSub}>{user.isGuest ? 'Guest session' : `Rating: ${user.rating}`}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />
          </Pressable>
        ) : null}
        {user ? (
          <Button label={user.isGuest ? 'Clear guest session' : 'Log out'} variant="danger" onPress={handleLogout} />
        ) : (
          <View style={{ gap: SPACING.sm }}>
            <Button label="Login" onPress={() => nav.navigate('Auth', { initialMode: 'signin' })} />
            <Button label="Register" variant="secondary" onPress={() => nav.navigate('Auth', { initialMode: 'register' })} />
          </View>
        )}
      </Section>

      <Section title="App" icon="information-circle-outline">
        <Row label="Version" value={<Text style={styles.valueText}>1.0.0</Text>} />
        <Row label="Build" value={<Text style={styles.valueText}>Expo SDK 54</Text>} />
        <Pressable style={styles.resetBtn} onPress={handleResetSettings}>
          <Ionicons name="refresh-outline" size={16} color={COLORS.textMuted} />
          <Text style={styles.resetBtnText}>Reset all settings to defaults</Text>
        </Pressable>
      </Section>

    </ScrollView>
  );
};

const Section: React.FC<{ title: string; icon: React.ComponentProps<typeof Ionicons>['name']; children: React.ReactNode }> = ({ title, icon, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={14} color={COLORS.textMuted} />
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
    </View>
    <View style={styles.card}>{children}</View>
  </View>
);

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    {value}
  </View>
);

const StepBtn: React.FC<{ icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void }> = ({ icon, onPress }) => (
  <Pressable style={styles.stepBtn} onPress={onPress}>
    <Ionicons name={icon} size={14} color={COLORS.textPrimary} />
  </Pressable>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { padding: SPACING.md, paddingBottom: SPACING.xl * 2 },
  section: { marginBottom: SPACING.lg },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  sectionTitle: {
    color: COLORS.textMuted,
    fontWeight: '700',
    fontSize: 11,
    letterSpacing: 0.8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
  },
  rowLabel: { color: COLORS.textPrimary, fontSize: 15 },
  valueText: { color: COLORS.textSecondary, fontSize: 14 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  volBar: {
    width: 80,
    height: 4,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 2,
    overflow: 'hidden',
  },
  volFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  themeGrid: { flexDirection: 'row', gap: 8, padding: SPACING.sm },
  boardThemeCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    gap: 6,
  },
  boardThemeCardActive: { borderColor: COLORS.secondary, backgroundColor: 'rgba(149,211,186,0.06)' },
  boardPreview: {
    width: 40, height: 40,
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderRadius: 4,
    overflow: 'hidden',
  },
  boardSquare: { width: 20, height: 20 },
  themeLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  themeLabelActive: { color: COLORS.secondary },
  checkIcon: { position: 'absolute', top: 4, right: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, padding: SPACING.sm },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: COLORS.onPrimary },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  accountAvatar: {
    width: 48, height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountAvatarText: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  accountInfo: { flex: 1 },
  accountName: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  accountSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: SPACING.md,
    marginTop: SPACING.xs,
  },
  resetBtnText: { color: COLORS.textMuted, fontSize: 13 },
});

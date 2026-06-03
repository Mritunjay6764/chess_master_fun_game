import React from 'react';
import { Alert, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { COLORS, RADIUS } from '@/constants/theme';

const CATEGORIES = [
  {
    icon: '🔲',
    label: 'Openings',
    mastery: 64,
    sub: 'The Ruy Lopez',
    progress: '8/12 Lessons',
  },
  {
    icon: '🧠',
    label: 'Tactics',
    mastery: 28,
    sub: 'Advanced Deflection',
    progress: '3/10 Lessons',
    accent: true,
  },
  {
    icon: '⏳',
    label: 'Endgames',
    mastery: 82,
    sub: 'Opposite Color Bishops',
    progress: '14/17 Lessons',
  },
];

const PATHS = [
  {
    icon: '👑',
    title: 'Game Analysis',
    desc: 'Upload your PGN for an AI-powered deep review of your blunders.',
    cta: 'Start analyzing',
  },
  {
    icon: '⏰',
    title: 'Blitz Drills',
    desc: 'Improve your speed calculation with timed puzzles and scenarios.',
    cta: 'Practice speed',
  },
];

export const LearnScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Featured Hero Lesson */}
        <View style={styles.heroCard}>
          <View style={styles.heroContent}>
            <Text style={styles.heroBadge}>MASTERCLASS</Text>
            <Text style={styles.heroTitle}>
              Positional Sacrifice in the Sicilian Defense
            </Text>
            <Text style={styles.heroDesc}>
              Learn the subtle art of trading material for long-term strategic
              dominance with Grandmaster Alexei Volkov.
            </Text>
            <View style={styles.heroActions}>
              <Pressable
                style={styles.heroPrimary}
                onPress={() => Alert.alert('Lesson', 'Continue lesson content coming soon.')}
              >
                <Text style={styles.heroPrimaryText}>Continue Lesson</Text>
              </Pressable>
              <Pressable
                style={styles.heroSecondary}
                onPress={() => Alert.alert('Syllabus', 'Full syllabus coming soon.')}
              >
                <Text style={styles.heroSecondaryText}>View Syllabus</Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Mastery Cards */}
        <Text style={styles.sectionTitle}>Mastery Progress</Text>
        <View style={styles.masteryGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.label}
              style={[styles.masteryCard, cat.accent && styles.masteryCardAccent]}
              onPress={() => Alert.alert(cat.label, `${cat.sub} — ${cat.progress}`)}
            >
              <View style={styles.masteryHeader}>
                <Text style={styles.masteryIcon}>{cat.icon}</Text>
                <Text style={styles.masteryPercent}>{cat.mastery}%</Text>
              </View>
              <Text style={styles.masteryLabel}>{cat.label}</Text>
              <Text style={styles.masteryDesc}>
                {cat.sub} • {cat.progress}
              </Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${cat.mastery}%` }]} />
              </View>
            </Pressable>
          ))}
        </View>

        {/* Learning Paths */}
        <Text style={styles.sectionTitle}>Learning Paths</Text>
        <View style={styles.pathsGrid}>
          {PATHS.map((path) => (
            <Pressable
              key={path.title}
              style={styles.pathCard}
              onPress={() => Alert.alert(path.title, path.desc)}
            >
              <View style={styles.pathIconWrap}>
                <Text style={styles.pathIcon}>{path.icon}</Text>
              </View>
              <View style={styles.pathContent}>
                <Text style={styles.pathTitle}>{path.title}</Text>
                <Text style={styles.pathDesc}>{path.desc}</Text>
                <Text style={styles.pathCTA}>{path.cta} →</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 },

  heroCard: {
    height: 340,
    borderRadius: RADIUS.lg, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
    marginBottom: 28,
    backgroundColor: COLORS.surfaceContainerHigh,
    justifyContent: 'flex-end',
  },
  heroContent: { padding: 24 },
  heroBadge: {
    fontSize: 11, fontWeight: '500', letterSpacing: 3,
    color: COLORS.secondary, marginBottom: 10, textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: 'Georgia', fontSize: 24, fontWeight: '600',
    color: COLORS.textPrimary, marginBottom: 8, lineHeight: 30,
  },
  heroDesc: {
    fontSize: 13, color: COLORS.textSecondary, lineHeight: 18,
    marginBottom: 18,
  },
  heroActions: { flexDirection: 'row', gap: 12 },
  heroPrimary: {
    backgroundColor: COLORS.secondary, paddingHorizontal: 22, paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  heroPrimaryText: {
    color: COLORS.onSecondary, fontSize: 12, fontWeight: '600', letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroSecondary: {
    borderWidth: 1, borderColor: 'rgba(185,199,228,0.3)',
    paddingHorizontal: 22, paddingVertical: 12, borderRadius: RADIUS.md,
  },
  heroSecondaryText: {
    color: COLORS.primary, fontSize: 12, fontWeight: '500', letterSpacing: 1,
    textTransform: 'uppercase',
  },

  sectionTitle: {
    fontFamily: 'Georgia', fontSize: 22, fontWeight: '500',
    color: COLORS.primary, marginBottom: 16,
  },

  masteryGrid: { gap: 12, marginBottom: 28 },
  masteryCard: {
    backgroundColor: COLORS.surfaceContainerLow, borderRadius: RADIUS.lg,
    padding: 20, borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
  },
  masteryCardAccent: { borderTopWidth: 2, borderTopColor: 'rgba(149,211,186,0.3)' },
  masteryHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8,
  },
  masteryIcon: { fontSize: 24 },
  masteryPercent: { color: COLORS.secondary, fontSize: 13, fontWeight: '600' },
  masteryLabel: {
    fontFamily: 'Georgia', fontSize: 20, fontWeight: '500', color: COLORS.textPrimary,
    marginBottom: 4,
  },
  masteryDesc: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 12, lineHeight: 16 },
  progressBar: {
    height: 5, backgroundColor: COLORS.surfaceContainerHigh,
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 3 },

  pathsGrid: { gap: 12 },
  pathCard: {
    flexDirection: 'row', gap: 16,
    backgroundColor: COLORS.surfaceContainerHigh, borderRadius: RADIUS.lg,
    padding: 20, borderWidth: 1, borderColor: 'rgba(185,199,228,0.15)',
    alignItems: 'center',
  },
  pathIconWrap: {
    width: 64, height: 64, borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceVariant, alignItems: 'center',
    justifyContent: 'center',
  },
  pathIcon: { fontSize: 28, opacity: 0.7 },
  pathContent: { flex: 1 },
  pathTitle: {
    fontFamily: 'Georgia', fontSize: 18, fontWeight: '500',
    color: COLORS.textPrimary, marginBottom: 4,
  },
  pathDesc: { color: COLORS.textSecondary, fontSize: 12, lineHeight: 16, marginBottom: 8 },
  pathCTA: { color: COLORS.secondary, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
});

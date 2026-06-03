// src/screens/SplashScreen.tsx — auto-routes to the guest-first home after preload
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { COLORS } from '@/constants/theme';
import { soundManager } from '@utils/soundManager';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Splash'>;

export const SplashScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const scale = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 8, stiffness: 100 });
    // Preload audio in the background — don't block navigation.
    soundManager.preload().catch(() => {});
    const id = setTimeout(() => {
      nav.reset({ index: 0, routes: [{ name: 'Main' }] });
    }, 900);
    return () => clearTimeout(id);
  }, [nav]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, style]}>
        <Text style={styles.crown}>♚</Text>
      </Animated.View>
      <Text style={styles.title}>GRANDMASTER</Text>
      <Text style={styles.subtitle}>STRATEGIC EXCELLENCE</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surfaceContainer,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(149,211,186,0.2)',
  },
  crown: { fontSize: 72, color: COLORS.primary },
  title: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontWeight: '600',
    marginTop: 24,
    letterSpacing: 2,
    fontFamily: 'Georgia',
  },
  subtitle: {
    color: COLORS.outline,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
});

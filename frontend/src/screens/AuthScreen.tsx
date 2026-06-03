import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useUserStore } from '@store/userStore';
import { AuthApi } from '@api/client';
import { COLORS, RADIUS, SPACING } from '@/constants/theme';
import type { RootStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'Auth'>;

type Mode = 'signin' | 'register' | 'guest';

export const AuthScreen: React.FC = () => {
  const nav = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Auth'>>();
  const setUser = useUserStore((s) => s.setUser);
  const loginGuest = useUserStore((s) => s.loginGuest);

  const [mode, setMode] = useState<Mode>(route.params?.initialMode ?? 'signin');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const goMain = () => nav.reset({ index: 0, routes: [{ name: 'Main' }] });

  useEffect(() => {
    if (route.params?.initialMode) {
      setMode(route.params.initialMode);
    }
  }, [route.params?.initialMode]);

  const handleGuest = () => {
    if (!username.trim()) {
      Alert.alert('Pick a username', 'A short nickname is required for guest play.');
      return;
    }
    loginGuest(username.trim());
    goMain();
  };

  const handleAuth = async () => {
    setLoading(true);
    try {
      const res =
        mode === 'signin'
          ? await AuthApi.login(email, password)
          : await AuthApi.register(email, password, username);
      setUser(res.data.user, res.data.token);
      goMain();
    } catch (e: any) {
      Alert.alert('Auth failed', e?.response?.data?.message ?? e.message ?? 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (mode === 'guest') {
      handleGuest();
    } else {
      handleAuth();
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo Branding */}
        <View style={styles.brandSection}>
          <Text style={styles.brandTitle}>GRANDMASTER</Text>
          <Text style={styles.brandSubtitle}>STRATEGIC EXCELLENCE</Text>
        </View>

        {/* Auth Card */}
        <View style={styles.card}>
          {/* Mode Tabs */}
          <View style={styles.modeTabs}>
            {(['signin', 'register', 'guest'] as const).map((m) => (
              <Pressable key={m} onPress={() => setMode(m)} style={styles.modeTab}>
                <Text style={[styles.modeTabText, mode === m && styles.modeTabActive]}>
                  {m === 'signin' ? 'Sign In' : m === 'register' ? 'Register' : 'Guest'}
                </Text>
                {mode === m && <View style={styles.modeTabIndicator} />}
              </Pressable>
            ))}
          </View>

          {/* Email / Username field */}
          {(mode === 'signin' || mode === 'register') && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>EMAIL OR USERNAME</Text>
              <TextInput
                placeholder="Enter your handle"
                placeholderTextColor={COLORS.outlineVariant}
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          )}

          {/* Username field (register / guest) */}
          {(mode === 'register' || mode === 'guest') && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>USERNAME</Text>
              <TextInput
                placeholder="Enter your username"
                placeholderTextColor={COLORS.outlineVariant}
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
              />
            </View>
          )}

          {/* Password field */}
          {(mode === 'signin' || mode === 'register') && (
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                placeholder="••••••••"
                placeholderTextColor={COLORS.outlineVariant}
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>
          )}

          {/* Remember me + Forgot Password (signin only) */}
          {mode === 'signin' && (
            <View style={styles.actionsRow}>
              <Pressable
                onPress={() => setRemember(!remember)}
                style={styles.rememberRow}
              >
                <View style={[styles.checkbox, remember && styles.checkboxActive]}>
                  {remember && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.rememberText}>Remember me</Text>
              </Pressable>
              <Pressable onPress={() => Alert.alert('Reset Password', 'Password reset coming soon.')}>
                <Text style={styles.forgotText}>Forgot Password?</Text>
              </Pressable>
            </View>
          )}

          {/* Submit Button */}
          <Pressable
            style={({ pressed }) => [
              styles.submitBtn,
              { opacity: pressed ? 0.9 : 1 },
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading
                ? 'Please wait...'
                : mode === 'signin'
                ? 'Sign In'
                : mode === 'register'
                ? 'Create Account'
                : 'Play as Guest'}
            </Text>
          </Pressable>

          {/* Divider (signin only) */}
          {mode === 'signin' && (
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>Or continue with</Text>
              <View style={styles.dividerLine} />
            </View>
          )}

          {/* Social buttons (signin only) */}
          {mode === 'signin' && (
            <View style={styles.socialRow}>
              <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Google Sign-In', 'Google sign-in coming soon.')}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialLabel}>Google</Text>
              </Pressable>
              <Pressable style={styles.socialBtn} onPress={() => Alert.alert('Apple Sign-In', 'Apple sign-in coming soon.')}>
                <Text style={styles.socialIcon}></Text>
                <Text style={styles.socialLabel}>Apple</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Footer */}
        {mode === 'signin' && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to the elite circle?</Text>
            <Pressable onPress={() => setMode('register')}>
              <Text style={styles.footerLink}> Create an account</Text>
            </Pressable>
          </View>
        )}
        {mode === 'register' && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already a member?</Text>
            <Pressable onPress={() => setMode('signin')}>
              <Text style={styles.footerLink}> Sign In</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  brandSection: {
    marginBottom: 48,
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 36,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: COLORS.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  brandSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 3,
    color: COLORS.outline,
    marginTop: 8,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: RADIUS.lg,
    padding: 32,
    borderTopWidth: 1,
    borderTopColor: 'rgba(149, 211, 186, 0.1)',
  },
  modeTabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 24,
  },
  modeTab: {
    alignItems: 'center',
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
    color: COLORS.outlineVariant,
    textTransform: 'uppercase',
  },
  modeTabActive: {
    color: COLORS.textPrimary,
  },
  modeTabIndicator: {
    width: 20,
    height: 2,
    backgroundColor: COLORS.secondary,
    marginTop: 6,
    borderRadius: 1,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: COLORS.outlineVariant,
    marginBottom: 4,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outlineVariant,
    color: COLORS.textPrimary,
    fontSize: 16,
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 16,
    height: 16,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  checkmark: {
    fontSize: 10,
    color: COLORS.onSecondary,
    fontWeight: '700',
  },
  rememberText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  forgotText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.1,
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
  submitBtn: {
    width: '100%',
    backgroundColor: COLORS.secondary,
    paddingVertical: 16,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    color: COLORS.onSecondary,
    textTransform: 'uppercase',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.outlineVariant,
    opacity: 0.3,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: COLORS.outline,
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
  },
  socialBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
    borderRadius: RADIUS.md,
    opacity: 0.8,
  },
  socialIcon: {
    fontSize: 18,
    color: COLORS.textPrimary,
  },
  socialLabel: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
    color: COLORS.textPrimary,
    textTransform: 'uppercase',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  footerText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.secondary,
    textTransform: 'uppercase',
  },
});

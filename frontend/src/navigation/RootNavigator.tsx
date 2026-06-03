// src/navigation/RootNavigator.tsx — top-level stack: Splash → Auth/Main → Game/PostGame/Replay
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '@screens/SplashScreen';
import { AuthScreen } from '@screens/AuthScreen';
import { MatchmakingScreen } from '@screens/MatchmakingScreen';
import { SinglePlayerScreen } from '@screens/SinglePlayerScreen';
import { PlayWithFriendScreen } from '@screens/PlayWithFriendScreen';
import { GameScreen } from '@screens/GameScreen';
import { PostGameScreen } from '@screens/PostGameScreen';
import { ReplayScreen } from '@screens/ReplayScreen';
import { ProfileScreen } from '@screens/ProfileScreen';
import { TabNavigator } from './TabNavigator';
import { COLORS } from '@/constants/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: COLORS.background,
    card: COLORS.surface,
    text: COLORS.textPrimary,
    primary: COLORS.primary,
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

export const RootNavigator: React.FC = () => (
  <NavigationContainer theme={navTheme}>
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{
        headerStyle: { backgroundColor: COLORS.background },
        headerTitleStyle: { color: COLORS.textPrimary },
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Matchmaking" component={MatchmakingScreen} options={{ title: 'Finding match' }} />
      <Stack.Screen name="SinglePlayer" component={SinglePlayerScreen} options={{ title: 'vs Computer' }} />
      <Stack.Screen name="PlayWithFriend" component={PlayWithFriendScreen} options={{ title: 'Play with Friend' }} />
      <Stack.Screen name="Game" component={GameScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PostGame" component={PostGameScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Replay" component={ReplayScreen} options={{ title: 'Replay' }} />
    </Stack.Navigator>
  </NavigationContainer>
);

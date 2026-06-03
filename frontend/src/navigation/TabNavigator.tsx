import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '@screens/HomeScreen';
import { LeaderboardScreen } from '@screens/LeaderboardScreen';
import { ChatScreen } from '@screens/ChatScreen';
import { SettingsScreen } from '@screens/SettingsScreen';
import { COLORS } from '@/constants/theme';
import type { TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const makeIcon = (active: IoniconName, inactive: IoniconName) =>
  ({ focused, color, size }: { focused: boolean; color: string; size: number }) => (
    <Ionicons name={focused ? active : inactive} size={size} color={color} />
  );

export const TabNavigator: React.FC = () => (
  <Tab.Navigator
    screenOptions={{
      headerStyle: { backgroundColor: COLORS.background, shadowColor: 'transparent', elevation: 0 },
      headerTitleStyle: {
        color: COLORS.textPrimary, fontFamily: 'Georgia', fontSize: 20,
        fontWeight: '600' as const, letterSpacing: -0.5,
      },
      tabBarStyle: {
        backgroundColor: COLORS.surfaceContainer,
        borderTopColor: 'rgba(68,71,77,0.12)',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        height: 64,
        paddingBottom: 8,
        paddingTop: 6,
      },
      tabBarActiveTintColor: COLORS.secondary,
      tabBarInactiveTintColor: COLORS.outlineVariant,
      tabBarLabelStyle: {
        fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.4,
        textTransform: 'uppercase', marginTop: 2,
      },
    }}
  >
    <Tab.Screen
      name="Play"
      component={HomeScreen}
      options={{
        title: 'Chess Master',
        tabBarLabel: 'Play',
        tabBarIcon: makeIcon('game-controller', 'game-controller-outline'),
      }}
    />
    <Tab.Screen
      name="Leaderboard"
      component={LeaderboardScreen}
      options={{
        title: 'Rankings',
        headerTitle: 'Chess Master',
        tabBarLabel: 'Rankings',
        tabBarIcon: makeIcon('trophy', 'trophy-outline'),
      }}
    />
    <Tab.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        title: 'Community',
        headerTitle: 'Chess Master',
        tabBarLabel: 'Chat',
        tabBarIcon: makeIcon('chatbubbles', 'chatbubbles-outline'),
      }}
    />
    <Tab.Screen
      name="Settings"
      component={SettingsScreen}
      options={{
        title: 'Settings',
        headerTitle: 'Chess Master',
        tabBarLabel: 'Settings',
        tabBarIcon: makeIcon('settings', 'settings-outline'),
      }}
    />
  </Tab.Navigator>
);

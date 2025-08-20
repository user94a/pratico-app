import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.light.tint,
        tabBarInactiveTintColor: Colors.light.tabIconDefault,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: {
          backgroundColor: Colors.light.cardBackground,
          borderTopColor: Colors.light.border,
          borderTopWidth: 0.5,
        },
        ...Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: Colors.light.cardBackground,
              borderTopColor: Colors.light.border,
              borderTopWidth: 0.5,
            },
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="scadenze"
        options={{
          title: 'Scadenze',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="clock.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="beni"
        options={{
          title: 'Beni',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="shippingbox.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documenti"
        options={{
          title: 'Documenti',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="doc.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profilo"
        options={{
          title: 'Impostazioni',
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="gearshape.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

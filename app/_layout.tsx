import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Colors } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import type { Session } from '@supabase/supabase-js';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Prima controlla l'autenticazione
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      
      // Solo se l'utente è autenticato, controlla l'onboarding
      if (data.session) {
        checkFirstLaunch();
      } else {
        setShowOnboarding(false); // Non mostrare onboarding se non autenticato
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      
      // Quando l'utente fa login, controlla l'onboarding
      if (session && showOnboarding === null) {
        checkFirstLaunch();
      } else if (!session) {
        setShowOnboarding(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (loaded && session !== undefined && showOnboarding !== null) {
      SplashScreen.hideAsync();
    }
  }, [loaded, session, showOnboarding]);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(hasSeenOnboarding === null);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setShowOnboarding(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
      setShowOnboarding(false);
    }
  };

  // Mostra loading finché non abbiamo tutti i dati
  if (!loaded || session === undefined || showOnboarding === null) {
    return null;
  }

  // Se l'utente è autenticato E deve vedere l'onboarding
  if (session && showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" backgroundColor={Colors.light.background} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

import { OnboardingScreen } from '@/components/OnboardingScreen';
import { Colors } from '@/constants/Colors';
import { api } from '@/lib/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Tipo semplificato per la sessione
type Session = {
  user: {
    id: string;
    email: string;
  };
} | null;

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    // Controlla l'autenticazione con il nuovo sistema
    const checkAuth = async () => {
      const { data } = await api.auth.getUser();
      const session = data.user ? { user: data.user } : null;
      setSession(session);
      
      // Solo se l'utente è autenticato, controlla l'onboarding
      if (data.user) {
        checkFirstLaunch();
      } else {
        setShowOnboarding(false); // Non mostrare onboarding se non autenticato
      }
    };

    checkAuth();
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
          <Stack.Screen 
            name="asset-detail" 
            options={{ 
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
          <Stack.Screen 
            name="profile-edit" 
            options={{ 
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
          <Stack.Screen 
            name="notifications-settings" 
            options={{ 
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
          <Stack.Screen 
            name="deadline-detail" 
            options={{ 
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
          <Stack.Screen 
            name="document-detail" 
            options={{ 
              headerShown: false,
              presentation: 'card',
              animation: 'slide_from_right'
            }} 
          />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="dark" backgroundColor={Colors.light.background} />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

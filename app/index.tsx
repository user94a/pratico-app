// app/index.tsx
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../lib/api';
import { router } from 'expo-router';
import { getAssets } from '../lib/api';

export default function Index() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Fai una vera chiamata API per verificare se il token è valido
        await getAssets();
        setIsAuthenticated(true);
      } catch (error: any) {
        console.log('Auth check failed:', error);
        if (error.message.includes('Sessione scaduta')) {
          setIsAuthenticated(false);
        } else {
          // Per altri errori (connessione, ecc.), considera ancora autenticato
          // ma mostra un messaggio di errore
          setIsAuthenticated(true);
        }
      }
    };

    checkAuth();
  }, []);

  console.log('Index render - auth state:', isAuthenticated === undefined ? 'loading' : isAuthenticated ? 'authenticated' : 'not authenticated');

  if (isAuthenticated === undefined) return null;
  if (!isAuthenticated) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/scadenze" />;
}

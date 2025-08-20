import { router } from 'expo-router';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAuthRedirect() {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'PASSWORD_RECOVERY') {
          router.replace('/reset-with-code');
          return;
        }

        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const isOtpFlow = path.includes('reset-with-code');

        if (event === 'SIGNED_IN' && !isOtpFlow) {
          router.replace('/(tabs)/scadenze');
        } else if (event === 'SIGNED_OUT') {
          router.replace('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);
} 
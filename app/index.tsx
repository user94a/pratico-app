// app/index.tsx
import type { Session } from '@supabase/supabase-js';
import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Index() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      console.log('Initial session check:', data.session ? 'authenticated' : 'not authenticated');
      setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, s) => {
      console.log('Auth state changed:', event, s ? 'authenticated' : 'not authenticated');
      setSession(s);
    });

    return () => subscription.unsubscribe();
  }, []);

  console.log('Index render - session state:', session === undefined ? 'loading' : session ? 'authenticated' : 'not authenticated');

  if (session === undefined) return null;
  if (!session) return <Redirect href="/login" />;
  return <Redirect href="/(tabs)/scadenze" />;
}

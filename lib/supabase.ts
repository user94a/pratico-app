// lib/supabase.ts

// 1) Polyfill per URL e fetch PRIMA di tutto
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// 2) Shim per location: serve perché alcune librerie (come supabase-js)
//    si aspettano un oggetto location anche in ambiente React Native
if (typeof (global as any).location === 'undefined') {
  (global as any).location = { pathname: '/' };
}

// 3) Variabili d'ambiente (Expo usa il prefisso EXPO_PUBLIC_ per esporle al client)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// 4) Creazione client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // fondamentale in RN
  },
});

// lib/supabase.ts

// 1) Polyfill per URL e fetch PRIMA di tutto
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// 2) Shim per location: serve perché alcune librerie (come supabase-js)
//    si aspettano un oggetto location anche in ambiente React Native
if (typeof (global as any).location === 'undefined') {
  (global as any).location = { pathname: '/' };
}

// 3) Variabili d'ambiente (Expo usa il prefisso EXPO_PUBLIC_ per esporle al client)
//    In produzione (TestFlight) assicuriamoci di avere un fallback da app.config extra
const sanitize = (v?: string) => (v && !v.startsWith('@') ? v : undefined);

const envUrl = sanitize(process.env.EXPO_PUBLIC_SUPABASE_URL as string | undefined);
const envAnon = sanitize(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY as string | undefined);

const extra = (Constants?.expoConfig?.extra ?? {}) as any;
const extraUrl = sanitize(extra?.supabaseUrl as string | undefined);
const extraAnon = sanitize(extra?.supabaseAnonKey as string | undefined);

const supabaseUrl = envUrl || extraUrl;
const supabaseAnonKey = envAnon || extraAnon;

if (!supabaseUrl || !supabaseAnonKey) {
  // Log esplicito per capire subito in produzione
  console.error('Supabase env missing. Check EXPO_PUBLIC_SUPABASE_URL/ANON_KEY or extra in app.config');
  throw new Error('supabaseUrl is required');
}

// 4) Creazione client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // fondamentale in RN
  },
});

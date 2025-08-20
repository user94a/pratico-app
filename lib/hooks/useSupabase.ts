import { createClient } from '@supabase/supabase-js'
import Constants from 'expo-constants'
import { useMemo } from 'react'

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL e Anon Key sono richiesti')
}

export function useSupabase() {
  const supabase = useMemo(() => 
    createClient(supabaseUrl, supabaseAnonKey), 
    []
  )

  return { supabase }
} 
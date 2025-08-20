-- Crea la tabella user_profiles per gestire i dati del profilo utente
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  cognome TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint per garantire un solo profilo per utente
  UNIQUE(user_id)
);

-- Abilita RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy per permettere agli utenti di vedere solo il proprio profilo
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di inserire il proprio profilo
CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy per permettere agli utenti di aggiornare il proprio profilo
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy per permettere agli utenti di eliminare il proprio profilo
CREATE POLICY "Users can delete own profile" ON public.user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Indice per performance
CREATE INDEX idx_user_profiles_user_id ON public.user_profiles(user_id); 
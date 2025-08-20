-- Migrazione per le nuove categorie di beni
-- Aggiorna il tipo enum esistente per supportare le nuove categorie

-- Primo step: aggiungi i nuovi valori all'enum
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'vehicle';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'home';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'device';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'appliance';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'animal';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'person';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'subscription';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'property';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'investment';
ALTER TYPE public.asset_type ADD VALUE IF NOT EXISTS 'other';

-- Aggiungi una colonna per il template del bene
ALTER TABLE public.assets 
  ADD COLUMN IF NOT EXISTS template_key text;

-- Migra i dati esistenti alle nuove categorie
UPDATE public.assets 
SET type = CASE 
  WHEN type = 'car' THEN 'vehicle'::asset_type
  WHEN type = 'house' THEN 'home'::asset_type
  ELSE 'other'::asset_type
END
WHERE type IN ('car', 'house');

-- Per gli asset esistenti senza template_key, impostiamo 'custom'
UPDATE public.assets 
SET template_key = 'custom'
WHERE template_key IS NULL;

-- Aggiungi un indice per template_key
CREATE INDEX IF NOT EXISTS assets_template_key_idx ON public.assets (template_key);

-- Commento per spiegare la nuova struttura
COMMENT ON COLUMN public.assets.template_key IS 'Chiave del template predefinito del bene (es: car, motorcycle, custom)';

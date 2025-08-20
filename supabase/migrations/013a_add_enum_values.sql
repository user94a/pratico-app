-- PARTE 1: Aggiungi solo i nuovi valori all'enum
-- Questa deve essere eseguita per prima e committata

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

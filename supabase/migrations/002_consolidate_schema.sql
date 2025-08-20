-- Crea enum per i tipi di asset
CREATE TYPE public.asset_type AS ENUM ('car', 'house', 'other');

-- Migra la colonna type di assets
ALTER TABLE public.assets 
  ALTER COLUMN type TYPE asset_type 
  USING (
    CASE 
      WHEN type = 'auto' OR type = 'moto' THEN 'car'::asset_type
      WHEN type = 'casa' THEN 'house'::asset_type
      ELSE 'other'::asset_type
    END
  );

-- Crea enum per lo stato delle scadenze
CREATE TYPE public.deadline_status AS ENUM ('pending', 'done', 'skipped');

-- Migra la colonna status di deadlines
ALTER TABLE public.deadlines 
  ALTER COLUMN status TYPE deadline_status 
  USING (
    CASE 
      WHEN status = 'active' THEN 'pending'::deadline_status
      WHEN status = 'completed' THEN 'done'::deadline_status
      ELSE 'pending'::deadline_status
    END
  );

-- Aggiunge FK mancanti
ALTER TABLE public.assets 
  ADD CONSTRAINT assets_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

ALTER TABLE public.deadlines 
  DROP CONSTRAINT IF EXISTS deadlines_asset_id_fkey,
  ADD CONSTRAINT deadlines_asset_id_fkey 
  FOREIGN KEY (asset_id) 
  REFERENCES public.assets(id) 
  ON DELETE CASCADE;

ALTER TABLE public.documents 
  DROP CONSTRAINT IF EXISTS documents_asset_id_fkey,
  ADD CONSTRAINT documents_asset_id_fkey 
  FOREIGN KEY (asset_id) 
  REFERENCES public.assets(id) 
  ON DELETE SET NULL;

-- Aggiunge unique constraint parziale su deadlines
ALTER TABLE public.deadlines 
  ADD CONSTRAINT deadlines_user_title_due_at_key 
  UNIQUE NULLS NOT DISTINCT (user_id, title, due_at);

-- Aggiunge indici
CREATE INDEX IF NOT EXISTS deadlines_due_at_idx ON public.deadlines (due_at);
CREATE INDEX IF NOT EXISTS deadlines_status_idx ON public.deadlines (status);
CREATE INDEX IF NOT EXISTS assets_type_idx ON public.assets (type);
CREATE INDEX IF NOT EXISTS documents_created_at_desc_idx ON public.documents (created_at DESC);
CREATE INDEX IF NOT EXISTS documents_tags_idx ON public.documents USING GIN (tags);

-- Aggiorna RLS policies
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Assets policies
DROP POLICY IF EXISTS "assets_select_own" ON public.assets;
CREATE POLICY "assets_select_own" ON public.assets
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "assets_insert_own" ON public.assets;
CREATE POLICY "assets_insert_own" ON public.assets
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "assets_update_own" ON public.assets;
CREATE POLICY "assets_update_own" ON public.assets
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "assets_delete_own" ON public.assets;
CREATE POLICY "assets_delete_own" ON public.assets
  FOR DELETE USING (user_id = auth.uid());

-- Deadlines policies
DROP POLICY IF EXISTS "deadlines_select_own" ON public.deadlines;
CREATE POLICY "deadlines_select_own" ON public.deadlines
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "deadlines_insert_own" ON public.deadlines;
CREATE POLICY "deadlines_insert_own" ON public.deadlines
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "deadlines_update_own" ON public.deadlines;
CREATE POLICY "deadlines_update_own" ON public.deadlines
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "deadlines_delete_own" ON public.deadlines;
CREATE POLICY "deadlines_delete_own" ON public.deadlines
  FOR DELETE USING (user_id = auth.uid());

-- Documents policies (più restrittive)
DROP POLICY IF EXISTS "documents_select_own" ON public.documents;
CREATE POLICY "documents_select_own" ON public.documents
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_insert_own" ON public.documents;
CREATE POLICY "documents_insert_own" ON public.documents
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_update_delete_own" ON public.documents;
CREATE POLICY "documents_update_delete_own" ON public.documents
  FOR ALL USING (user_id = auth.uid());

-- Crea view per scadenze imminenti
CREATE OR REPLACE VIEW public.v_upcoming_deadlines AS
SELECT 
  d.id,
  d.title,
  d.due_at,
  EXTRACT(DAY FROM (d.due_at - now())) as days_left,
  a.name as asset_name,
  a.type as asset_type
FROM public.deadlines d
LEFT JOIN public.assets a ON d.asset_id = a.id
WHERE 
  d.user_id = auth.uid()
  AND d.status = 'pending'
  AND d.due_at >= now() - interval '1 day'
ORDER BY d.due_at ASC; 
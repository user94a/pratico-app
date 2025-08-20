-- Add missing columns to documents and keep updated_at in sync

-- Add description column if missing
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS description text;

-- Add updated_at column if missing
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Helper function to automatically bump updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to keep updated_at fresh on updates
DROP TRIGGER IF EXISTS documents_set_updated_at ON public.documents;
CREATE TRIGGER documents_set_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();



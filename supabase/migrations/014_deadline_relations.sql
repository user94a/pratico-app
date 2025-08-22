-- Creazione tabella per associazioni multiple beni-scadenze
CREATE TABLE IF NOT EXISTS deadline_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deadline_id, asset_id)
);

-- Creazione tabella per associazioni multiple documenti-scadenze
CREATE TABLE IF NOT EXISTS deadline_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deadline_id UUID NOT NULL REFERENCES deadlines(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(deadline_id, document_id)
);

-- Creazione indici per performance
CREATE INDEX IF NOT EXISTS idx_deadline_assets_deadline_id ON deadline_assets(deadline_id);
CREATE INDEX IF NOT EXISTS idx_deadline_assets_asset_id ON deadline_assets(asset_id);
CREATE INDEX IF NOT EXISTS idx_deadline_documents_deadline_id ON deadline_documents(deadline_id);
CREATE INDEX IF NOT EXISTS idx_deadline_documents_document_id ON deadline_documents(document_id);

-- Migrazione dati esistenti (se ci sono scadenze con asset_id)
INSERT INTO deadline_assets (deadline_id, asset_id)
SELECT id, asset_id 
FROM deadlines 
WHERE asset_id IS NOT NULL
ON CONFLICT (deadline_id, asset_id) DO NOTHING;

-- Rimuovere la colonna asset_id dalla tabella deadlines (dopo la migrazione)
-- ALTER TABLE deadlines DROP COLUMN IF EXISTS asset_id;

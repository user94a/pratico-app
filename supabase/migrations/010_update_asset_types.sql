-- Aggiorna l'enum asset_type con le nuove categorie

-- Prima aggiungiamo i nuovi valori all'enum
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'vehicles';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'properties'; 
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'animals';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'people';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'devices';
ALTER TYPE asset_type ADD VALUE IF NOT EXISTS 'subscriptions';

-- Migra i dati esistenti
UPDATE assets SET type = 'vehicles' WHERE type = 'car';
UPDATE assets SET type = 'properties' WHERE type = 'house';

-- Aggiorna anche i deadline_templates se esistono
UPDATE deadline_templates SET asset_type = 'vehicles' WHERE asset_type = 'car';
UPDATE deadline_templates SET asset_type = 'properties' WHERE asset_type = 'house';

-- Nota: Non possiamo rimuovere i vecchi valori dell'enum direttamente in PostgreSQL
-- quindi lasciamo 'car', 'house' per compatibilità
-- In un secondo momento si potranno rimuovere se necessario 
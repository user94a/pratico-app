-- Aggiunge supporto per icone personalizzate agli assets

ALTER TABLE assets ADD COLUMN custom_icon TEXT;
 
-- Aggiunge un commento per documentare il campo
COMMENT ON COLUMN assets.custom_icon IS 'Nome dell''icona SF Symbol personalizzata (es: car.fill, house.fill)'; 
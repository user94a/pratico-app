-- Rendi pubblico il bucket documents per permettere l'accesso ai file
UPDATE storage.buckets 
SET public = true 
WHERE id = 'documents';

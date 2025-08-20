-- Verifica enum e colonne
SELECT * FROM pg_type WHERE typname IN ('asset_type', 'deadline_status');
SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'assets' AND column_name = 'type';

SELECT column_name, data_type, udt_name 
FROM information_schema.columns 
WHERE table_name = 'deadlines' AND column_name = 'status';

-- Verifica FK
SELECT
    tc.table_schema, 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('assets', 'deadlines', 'documents');

-- Verifica indici
SELECT
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN ('assets', 'deadlines', 'documents');

-- Verifica RLS
SELECT
    tablename,
    hasrowsecurity,
    rowsecurity
FROM
    pg_tables
WHERE
    schemaname = 'public'
    AND tablename IN ('assets', 'deadlines', 'documents');

-- Verifica policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM
    pg_policies
WHERE
    schemaname = 'public'
    AND tablename IN ('assets', 'deadlines', 'documents');

-- Test view (come utente autenticato)
SELECT * FROM v_upcoming_deadlines LIMIT 5; 
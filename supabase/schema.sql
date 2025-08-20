-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ASSETS
create table if not exists public.assets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid(),
  type text not null check (type in ('auto','moto','casa','persona','altro')),
  name text not null,
  identifier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;

drop policy if exists "assets_select_own" on public.assets;
create policy "assets_select_own"
  on public.assets for select
  using (user_id = auth.uid());

drop policy if exists "assets_insert_own" on public.assets;
create policy "assets_insert_own"
  on public.assets for insert
  with check (user_id = auth.uid());

drop policy if exists "assets_update_own" on public.assets;
create policy "assets_update_own"
  on public.assets for update
  using (user_id = auth.uid());

drop policy if exists "assets_delete_own" on public.assets;
create policy "assets_delete_own"
  on public.assets for delete
  using (user_id = auth.uid());

-- DEADLINES
create table if not exists public.deadlines (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid(),
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  notes text,
  status text not null default 'active' check (status in ('active','completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.deadlines enable row level security;

drop policy if exists "deadlines_select_own" on public.deadlines;
create policy "deadlines_select_own"
  on public.deadlines for select
  using (user_id = auth.uid());

drop policy if exists "deadlines_insert_own" on public.deadlines;
create policy "deadlines_insert_own"
  on public.deadlines for insert
  with check (user_id = auth.uid());

drop policy if exists "deadlines_update_own" on public.deadlines;
create policy "deadlines_update_own"
  on public.deadlines for update
  using (user_id = auth.uid());

drop policy if exists "deadlines_delete_own" on public.deadlines;
create policy "deadlines_delete_own"
  on public.deadlines for delete
  using (user_id = auth.uid());

-- DOCUMENTS (metadata)
create table if not exists public.documents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null default auth.uid(),
  asset_id uuid references public.assets(id) on delete set null,
  title text not null,
  tags text[],
  storage_path text, -- path in storage bucket
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
  on public.documents for select
  using (user_id = auth.uid());

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
  on public.documents for insert
  with check (user_id = auth.uid());

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
  on public.documents for update
  using (user_id = auth.uid());

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
  on public.documents for delete
  using (user_id = auth.uid());

-- STORAGE bucket for documents
-- Creazione bucket (privato) con limiti facoltativi
select storage.create_bucket(
  'documents',
  public := false,
  file_size_limit := 5242880,
  allowed_mime_types := array['image/jpeg','image/png','application/pdf']
);

-- Esempi (corretti) di policy su storage.objects (usa position(substring in string))
-- create policy "storage_read_own" on storage.objects for select to authenticated
-- using (
--   bucket_id = 'documents'
--   and position(auth.uid()::text || '/' in name) = 1
-- );
-- create policy "storage_write_own" on storage.objects for insert to authenticated
-- with check (
--   bucket_id = 'documents'
--   and position(auth.uid()::text || '/' in name) = 1
-- );
-- create policy "storage_update_own" on storage.objects for update to authenticated
-- using (
--   bucket_id = 'documents'
--   and position(auth.uid()::text || '/' in name) = 1
-- );
-- create policy "storage_delete_own" on storage.objects for delete to authenticated
-- using (
--   bucket_id = 'documents'
--   and position(auth.uid()::text || '/' in name) = 1
-- );

-- Policy attive
create policy "documents_select_own" on storage.objects
for select to authenticated
using (bucket_id = 'documents' and position(auth.uid()::text || '/' in name) = 1);

create policy "documents_insert_own" on storage.objects
for insert to authenticated
with check (bucket_id = 'documents' and position(auth.uid()::text || '/' in name) = 1);

create policy "documents_update_own" on storage.objects
for update to authenticated
using (bucket_id = 'documents' and position(auth.uid()::text || '/' in name) = 1);

create policy "documents_delete_own" on storage.objects
for delete to authenticated
using (bucket_id = 'documents' and position(auth.uid()::text || '/' in name) = 1); 
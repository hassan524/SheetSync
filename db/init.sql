-- ============================================================
-- SheetSync — Complete Database Schema (Supabase / PostgreSQL)
-- ============================================================
-- This file documents the existing production schema.
-- Do NOT run this against an existing database without checking
-- for conflicts first.
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'editor', 'viewer')),
  joined_at timestamptz default now(),
  unique(organization_id, user_id)
);

create table if not exists public.folders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_id uuid references public.organizations(id) on delete cascade,
  owner_id uuid references public.profiles(id) on delete cascade,
  is_personal boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (
    (is_personal = true and organization_id is null) or
    (is_personal = false and organization_id is not null)
  )
);

alter table public.folders
drop column if exists parent_folder_id;

create table if not exists public.sheets (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'Untitled Sheet',
  folder_id uuid references public.folders(id) on delete set null,
  owner_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  template_id text,
  is_starred boolean default false,
  is_personal boolean default true,
  last_modified_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  check (
    (is_personal = true and organization_id is null) or
    (is_personal = false and organization_id is not null)
  )
);

create table if not exists public.columns (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references public.sheets(id) on delete cascade,
  column_key text not null,
  name text not null,
  type text not null default 'text',
  width integer default 150,
  position integer not null,
  text_wrap_enabled boolean default false,
  created_at timestamptz default now(),
  unique(sheet_id, column_key),
  unique(sheet_id, position)
);

create table if not exists public.rows (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references public.sheets(id) on delete cascade,
  row_key text not null,
  position integer not null,
  data jsonb not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(sheet_id, row_key),
  unique(sheet_id, position)
);

create table if not exists public.cell_formats (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references public.sheets(id) on delete cascade,
  cell_key text not null,
  bold boolean default false,
  italic boolean default false,
  underline boolean default false,
  strikethrough boolean default false,
  font_size integer default 12,
  text_color text default '#000000',
  bg_color text default '#ffffff',
  text_align text default 'left',
  created_at timestamptz default now(),
  unique(sheet_id, cell_key)
);

create table if not exists public.cell_type_overrides (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references public.sheets(id) on delete cascade,
  cell_key text not null,
  type text not null,
  created_at timestamptz default now(),
  unique(sheet_id, cell_key)
);

-- ============================================================
-- FORMULAS TABLE
-- ============================================================
-- Stores per-cell formulas AND whole-column formulas.
--
-- Per-cell formula:   cell_key = "rowIndex-columnKey"  e.g. "0-amount"
-- Column formula:     cell_key = "col:columnKey"       e.g. "col:amount"
--
-- Column formulas apply to EVERY row in that column. If a cell
-- has BOTH a per-cell formula and a column formula, the per-cell
-- formula takes priority.
-- ============================================================
create table if not exists public.formulas (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references public.sheets(id) on delete cascade,
  cell_key text not null,
  formula text not null,
  created_at timestamptz default now(),
  unique(sheet_id, cell_key)
);

create table if not exists public.protected_cells (
  id uuid primary key default gen_random_uuid(),
  sheet_id uuid references public.sheets(id) on delete cascade,
  cell_key text not null,
  created_at timestamptz default now(),
  unique(sheet_id, cell_key)
);

create table if not exists public.templates (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

create table organization_invites (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid references organizations(id) on delete cascade,
  email text not null,
  role text default 'viewer',
  invited_by uuid references auth.users(id),
  token text unique not null,
  status text default 'pending',
  created_at timestamp default now(),
  expires_at timestamp
);

insert into public.templates (name) values
('QA Tracker'),
('Project Tracker'),
('Finance Tracker'),
('Blank Sheet');

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists idx_sheets_owner on public.sheets(owner_id);
create index if not exists idx_sheets_organization on public.sheets(organization_id);
create index if not exists idx_sheets_folder on public.sheets(folder_id);
create index if not exists idx_rows_sheet on public.rows(sheet_id);
create index if not exists idx_columns_sheet on public.columns(sheet_id);
create index if not exists idx_cell_formats_sheet on public.cell_formats(sheet_id);
create index if not exists idx_formulas_sheet on public.formulas(sheet_id);
create index if not exists idx_protected_cells_sheet on public.protected_cells(sheet_id);
create index if not exists idx_cell_type_overrides_sheet on public.cell_type_overrides(sheet_id);
create index if not exists idx_organization_members_org on public.organization_members(organization_id);
create index if not exists idx_organization_members_user on public.organization_members(user_id);
create index if not exists idx_folders_organization on public.folders(organization_id);
create index if not exists idx_folders_owner on public.folders(owner_id);
create unique index if not exists idx_organization_email
on public.organization_invites(organization_id, email);

CREATE TABLE IF NOT EXISTS public.sheet_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sheet_id UUID REFERENCES public.sheets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  target TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sheet_history_sheet ON public.sheet_history(sheet_id);
CREATE INDEX IF NOT EXISTS idx_sheet_history_user ON public.sheet_history(user_id);
CREATE INDEX IF NOT EXISTS idx_sheet_history_created_at ON public.sheet_history(created_at);
CREATE INDEX IF NOT EXISTS idx_sheets_created_at ON public.sheets(created_at);
CREATE INDEX IF NOT EXISTS idx_sheets_updated_at ON public.sheets(updated_at);
CREATE INDEX IF NOT EXISTS idx_rows_updated_at ON public.rows(updated_at);

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS storage_limit NUMERIC DEFAULT 10;

ALTER TABLE public.sheets
ADD COLUMN IF NOT EXISTS size_mb NUMERIC DEFAULT 0;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS description text;

ALTER TABLE public.organization_members
ADD COLUMN IF NOT EXISTS status text default 'offline'
  check (status in ('online', 'offline', 'away')),
ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_org_members_status ON public.organization_members(status);
CREATE INDEX IF NOT EXISTS idx_org_members_last_active ON public.organization_members(last_active_at);

ALTER TABLE public.cell_formats
ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'Arial';

ALTER TABLE public.cell_formats
ADD COLUMN IF NOT EXISTS text_wrap BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.columns
DROP COLUMN IF EXISTS text_wrap_enabled;
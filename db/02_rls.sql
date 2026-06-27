-- ============================================================
--  SHEETSYNC — 02_RLS.SQL
--  Helper functions + all RLS policies in their FINAL state.
--  Safe to re-run — drops everything first then rebuilds.
--  Run AFTER 01_tables.sql
-- ============================================================


-- ------------------------------------------------------------
-- 0. CLEAN SLATE — drop all existing policies and helpers
-- ------------------------------------------------------------
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public'
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

drop function if exists public.is_org_member(uuid, text[]);
drop function if exists public.is_sheet_member(uuid, text[]);
drop function if exists public.can_access_sheet(uuid);
drop function if exists public.can_edit_sheet(uuid);


-- ------------------------------------------------------------
-- 1. HELPER FUNCTIONS
--    SECURITY DEFINER lets these functions bypass RLS internally.
--    This is what prevents infinite recursion when a policy on
--    organization_members calls a function that also reads
--    organization_members.
-- ------------------------------------------------------------

-- True if the caller belongs to org_id with one of the required roles
create or replace function public.is_org_member(
  org_id         uuid,
  required_roles text[] default array['owner','admin','editor','viewer']
)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org_id
      and user_id         = auth.uid()
      and role            = any(required_roles)
  );
$$;

-- True if the caller is a direct sheet_member with one of the required roles
create or replace function public.is_sheet_member(
  p_sheet_id     uuid,
  required_roles text[] default array['admin','editor','viewer']
)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.sheet_members
    where sheet_id = p_sheet_id
      and user_id  = auth.uid()
      and role     = any(required_roles)
  );
$$;

-- True if the caller can VIEW a sheet:
--   owns it  OR  is in the sheet's org  OR  is a direct sheet_member
create or replace function public.can_access_sheet(sid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.sheets s
    where s.id = sid
      and (
        s.owner_id = auth.uid()
        or (s.organization_id is not null and public.is_org_member(s.organization_id))
        or public.is_sheet_member(sid, array['admin','editor','viewer'])
      )
  );
$$;

-- True if the caller can EDIT a sheet:
--   owns it  OR  is org owner/admin/editor  OR  is direct sheet admin/editor
create or replace function public.can_edit_sheet(sid uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.sheets s
    where s.id = sid
      and (
        s.owner_id = auth.uid()
        or (s.organization_id is not null and public.is_org_member(s.organization_id, array['owner','admin','editor']))
        or public.is_sheet_member(sid, array['admin','editor'])
      )
  );
$$;


-- ------------------------------------------------------------
-- 2. PROFILES
-- ------------------------------------------------------------
alter table public.profiles enable row level security;

-- Anyone signed in can read any profile (needed to show collaborator names/avatars)
create policy "profiles_select" on public.profiles
  for select using (true);

-- You can only create your own profile row
create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());

-- You can only edit your own profile
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- You can only delete your own profile
create policy "profiles_delete" on public.profiles
  for delete using (id = auth.uid());


-- ------------------------------------------------------------
-- 3. ORGANIZATIONS
-- ------------------------------------------------------------
alter table public.organizations enable row level security;

-- Only members of an org can see it
create policy "organizations_select" on public.organizations
  for select using (public.is_org_member(id));

-- Any logged-in user can create an org, but must set themselves as creator
create policy "organizations_insert" on public.organizations
  for insert with check (auth.uid() is not null and created_by = auth.uid());

-- Only owner/admin can update org settings
create policy "organizations_update" on public.organizations
  for update using (public.is_org_member(id, array['owner','admin']));

-- Only the owner can delete the org
create policy "organizations_delete" on public.organizations
  for delete using (public.is_org_member(id, array['owner']));


-- ------------------------------------------------------------
-- 4. ORGANIZATION_MEMBERS
-- ------------------------------------------------------------
alter table public.organization_members enable row level security;

-- You can see your own row, or any member row in an org you belong to (to show the team list)
create policy "org_members_select" on public.organization_members
  for select using (
    user_id = auth.uid() or public.is_org_member(organization_id)
  );

-- Only owner/admin can add new members
create policy "org_members_insert" on public.organization_members
  for insert with check (public.is_org_member(organization_id, array['owner','admin']));

-- You can update your own row (presence/status), or owner/admin can change roles
create policy "org_members_update" on public.organization_members
  for update using (
    user_id = auth.uid() or public.is_org_member(organization_id, array['owner','admin'])
  );

-- You can leave (remove yourself), or owner/admin can remove others
create policy "org_members_delete" on public.organization_members
  for delete using (
    user_id = auth.uid() or public.is_org_member(organization_id, array['owner','admin'])
  );


-- ------------------------------------------------------------
-- 5. ORGANIZATION_INVITES
-- ------------------------------------------------------------
alter table public.organization_invites enable row level security;

-- Org owner/admin can see all invites; invited person can see their own invite
create policy "org_invites_select" on public.organization_invites
  for select using (
    public.is_org_member(organization_id, array['owner','admin'])
    or email = (select email from public.profiles where id = auth.uid())
  );

-- Only owner/admin can send invites
create policy "org_invites_insert" on public.organization_invites
  for insert with check (public.is_org_member(organization_id, array['owner','admin']));

-- Owner/admin can edit; invited person can update status (e.g. accept)
create policy "org_invites_update" on public.organization_invites
  for update using (
    public.is_org_member(organization_id, array['owner','admin'])
    or email = (select email from public.profiles where id = auth.uid())
  );

-- Only owner/admin can revoke an invite
create policy "org_invites_delete" on public.organization_invites
  for delete using (public.is_org_member(organization_id, array['owner','admin']));


-- ------------------------------------------------------------
-- 6. SHEETS
-- ------------------------------------------------------------
alter table public.sheets enable row level security;

-- Visible if: you own it, it's in your org, or it was shared directly with you
create policy "sheets_select" on public.sheets
  for select using (
    owner_id = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id))
    or public.is_sheet_member(id, array['admin','editor','viewer'])
  );

-- You can only create a sheet as yourself; org sheets require at least editor role
create policy "sheets_insert" on public.sheets
  for insert with check (
    owner_id = auth.uid()
    and (
      organization_id is null
      or public.is_org_member(organization_id, array['owner','admin','editor'])
    )
  );

-- Owner, org editor+, or direct sheet editor/admin can update sheet metadata
create policy "sheets_update" on public.sheets
  for update using (public.can_edit_sheet(id));

-- Only the owner or org owner/admin can delete a sheet
create policy "sheets_delete" on public.sheets
  for delete using (
    owner_id = auth.uid()
    or (organization_id is not null and public.is_org_member(organization_id, array['owner','admin']))
  );


-- ------------------------------------------------------------
-- 7. SHEET_MEMBERS
-- ------------------------------------------------------------
alter table public.sheet_members enable row level security;

-- You can see your own membership, or all members if you own the sheet
create policy "sheet_members_select" on public.sheet_members
  for select using (
    user_id = auth.uid()
    or sheet_id in (select id from public.sheets where owner_id = auth.uid())
  );

-- Only the sheet owner can add members directly
-- (invite-link API uses service-role key which bypasses RLS)
create policy "sheet_members_insert" on public.sheet_members
  for insert with check (
    sheet_id in (select id from public.sheets where owner_id = auth.uid())
  );

-- You can remove yourself; the owner can remove anyone
create policy "sheet_members_delete" on public.sheet_members
  for delete using (
    user_id = auth.uid()
    or sheet_id in (select id from public.sheets where owner_id = auth.uid())
  );


-- ------------------------------------------------------------
-- 8. SHEET DATA TABLES
--    columns, rows, cell_formats, cell_type_overrides,
--    formulas, protected_rows
--    Viewable by anyone with sheet access; editable by editors+
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['columns','rows','cell_formats','cell_type_overrides','formulas','protected_rows']
  loop
    execute format('alter table public.%I enable row level security', t);

    -- Anyone who can see the sheet can read this data
    execute format('create policy "%1$s_select" on public.%1$s for select using (public.can_access_sheet(sheet_id))', t);

    -- Only editors+ can insert
    execute format('create policy "%1$s_insert" on public.%1$s for insert with check (public.can_edit_sheet(sheet_id))', t);

    -- Only editors+ can update
    execute format('create policy "%1$s_update" on public.%1$s for update using (public.can_edit_sheet(sheet_id)) with check (public.can_edit_sheet(sheet_id))', t);

    -- Only editors+ can delete
    execute format('create policy "%1$s_delete" on public.%1$s for delete using (public.can_edit_sheet(sheet_id))', t);
  end loop;
end $$;


-- ------------------------------------------------------------
-- 9. TEMPLATES  (global read-only catalog)
-- ------------------------------------------------------------
alter table public.templates enable row level security;

-- Any logged-in user can browse templates
-- No insert/update/delete policy — only service-role key can manage templates
create policy "templates_select" on public.templates
  for select using (auth.uid() is not null);


-- ------------------------------------------------------------
-- 10. SHEET_HISTORY
-- ------------------------------------------------------------
alter table public.sheet_history enable row level security;

-- Anyone with sheet access can view the activity log
create policy "sheet_history_select" on public.sheet_history
  for select using (public.can_access_sheet(sheet_id));

-- Anyone with sheet access can log an action
create policy "sheet_history_insert" on public.sheet_history
  for insert with check (public.can_access_sheet(sheet_id));

-- Only editors+ can purge history (no update — history is append-only)
create policy "sheet_history_delete" on public.sheet_history
  for delete using (public.can_edit_sheet(sheet_id));


-- ------------------------------------------------------------
-- 11. SHEET_SNAPSHOTS
-- ------------------------------------------------------------
alter table public.sheet_snapshots enable row level security;

-- Anyone with sheet access can view version history
create policy "snapshots_select" on public.sheet_snapshots
  for select using (public.can_access_sheet(sheet_id));

-- Only editors+ can create a snapshot, and only as themselves
create policy "snapshots_insert" on public.sheet_snapshots
  for insert with check (public.can_edit_sheet(sheet_id) and created_by = auth.uid());

-- Creator or any sheet editor can rename/label a snapshot
create policy "snapshots_update" on public.sheet_snapshots
  for update using (created_by = auth.uid() or public.can_edit_sheet(sheet_id));

-- Creator or any sheet editor can delete a snapshot
create policy "snapshots_delete" on public.sheet_snapshots
  for delete using (created_by = auth.uid() or public.can_edit_sheet(sheet_id));


-- ------------------------------------------------------------
-- 12. PUSH_TOKENS  (fully private to each user)
-- ------------------------------------------------------------
alter table public.push_tokens enable row level security;

create policy "push_tokens_select" on public.push_tokens for select using (user_id = auth.uid());
create policy "push_tokens_insert" on public.push_tokens for insert with check (user_id = auth.uid());
create policy "push_tokens_update" on public.push_tokens for update using (user_id = auth.uid());
create policy "push_tokens_delete" on public.push_tokens for delete using (user_id = auth.uid());


-- ------------------------------------------------------------
-- DONE
-- ------------------------------------------------------------
notify pgrst, 'reload schema';
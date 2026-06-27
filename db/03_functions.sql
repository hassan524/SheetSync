-- ============================================================
--  SHEETSYNC — 03_FUNCTIONS.SQL
--  Triggers and utility functions.
--  Run AFTER 01_tables.sql and 02_rls.sql
-- ============================================================


-- ------------------------------------------------------------
-- handle_new_google_user
-- Trigger: fires after a new user signs up via Supabase Auth
-- (works for both email and Google OAuth)
-- Creates a matching row in public.profiles automatically.
-- ------------------------------------------------------------
create or replace function public.handle_new_google_user()
returns trigger as $$
begin
  -- Guard: skip if email is somehow missing
  if new.email is null then
    raise notice 'New user has no email, skipping profile creation';
    return new;
  end if;

  insert into public.profiles (
    id,
    email,
    name,
    avatar_url,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      null
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture',
      null
    ),
    now(),
    now()
  )
  -- If the user already has a profile (e.g. re-registering), do nothing
  on conflict (id) do nothing;

  return new;

exception
  when others then
    raise notice 'Error inserting new user profile: %', sqlerrm;
    return new;
end;
$$ language plpgsql security definer;


-- Attach the trigger to auth.users
-- Drops first so this file is safe to re-run
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_google_user();


-- ------------------------------------------------------------
-- DONE
-- ------------------------------------------------------------
notify pgrst, 'reload schema';
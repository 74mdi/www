# Guestbook Setup (Discord + GitHub + Google + Database)

This project now uses **Supabase Auth** + **Supabase Postgres** for `/guestbook`.

## 1. Create a Supabase project

1. Go to <https://supabase.com> and create a project.
2. Open `Project Settings -> API`.
3. Copy:
   - `Project URL` -> use as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key -> use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## 2. Add env vars

Put these in your `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 3. Configure Auth URLs in Supabase

Open `Authentication -> URL Configuration`:

1. Set `Site URL`:
   - local: `http://localhost:5000`
   - production: `https://your-domain.com`
2. Add `Redirect URLs`:
   - `http://localhost:5000/guestbook`
   - `https://your-domain.com/guestbook`
   - optional previews: `https://*.vercel.app/guestbook`

## 4. Enable OAuth providers

Open `Authentication -> Providers`.

Enable each provider and paste client credentials from each platform:

- `Discord`
- `GitHub`
- `Google`

Use this callback URL in each provider dashboard:

```text
https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
```

Notes:
- GitHub: create an OAuth App, set callback URL above.
- Google: create OAuth credentials (Web application), set authorized redirect URI above.
- Discord: create OAuth2 app, set redirect URL above.

## 5. Create the guestbook tables + RLS

Run this SQL in `Supabase -> SQL Editor`:

```sql
create table if not exists public.guestbook_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar_url text,
  provider text,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.guestbook_entries (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 40),
  avatar_url text,
  provider text,
  message text not null check (char_length(message) between 1 and 280),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists guestbook_entries_created_at_idx
on public.guestbook_entries (created_at desc);

alter table public.guestbook_profiles enable row level security;
alter table public.guestbook_entries enable row level security;

drop policy if exists "profiles_select_all" on public.guestbook_profiles;
drop policy if exists "profiles_insert_own" on public.guestbook_profiles;
drop policy if exists "profiles_update_own" on public.guestbook_profiles;
drop policy if exists "entries_select_all" on public.guestbook_entries;
drop policy if exists "entries_insert_own" on public.guestbook_entries;

create policy "profiles_select_all"
on public.guestbook_profiles
for select
using (true);

create policy "profiles_insert_own"
on public.guestbook_profiles
for insert
with check (auth.uid() = user_id);

create policy "profiles_update_own"
on public.guestbook_profiles
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "entries_select_all"
on public.guestbook_entries
for select
using (true);

create policy "entries_insert_own"
on public.guestbook_entries
for insert
with check (auth.uid() = user_id);
```

## 6. Run locally

```bash
npm run dev
```

Open `http://localhost:5000/guestbook`:
1. Sign in with Discord/GitHub/Google.
2. Select and save your guestbook name.
3. Post a message.

## 7. Deploy

On Vercel (or your host), add:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

After deploy, make sure production domain is listed in Supabase redirect URLs.

## Troubleshooting

### Error: `requested path is invalid`

This is usually a bad Auth URL config in Supabase.

Use exactly:

- `Site URL`: `https://qaiik.vercel.app`
- `Redirect URL` (allow list): `https://qaiik.vercel.app/guestbook`

Also add local:

- `http://localhost:5000/guestbook`

Important:
- Include `https://` in production URLs.
- Do not set Site URL as `qaiik.vercel.app/guestbook` (without protocol).
- Keep provider callback as `https://<PROJECT_REF>.supabase.co/auth/v1/callback`.

### Error: `Could not find the table 'public.guestbook_profiles' in the schema cache`

Run the SQL in section 5 in Supabase SQL Editor (same project as your keys).

If you already created the table:
1. Open `API Docs` in Supabase and verify `public.guestbook_profiles` exists.
2. Wait a few seconds and retry (schema cache refresh can be delayed briefly).
3. Confirm your app env keys point to the same project ref where tables were created.

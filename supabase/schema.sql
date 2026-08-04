-- Ejecutar en Supabase SQL Editor. Ajusta los campos a las tablas existentes de Vibra.
do $$ begin
  create type public.admin_role as enum ('support', 'moderator', 'admin', 'superadmin');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null default 'support',
  mfa_required boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.feature_flags (
  key text primary key,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id),
  action text not null,
  resource_type text not null,
  resource_id text,
  before_data jsonb,
  after_data jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.verification_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null;
end $$;

create table if not exists public.verification_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  document_url text,
  status public.verification_status not null default 'pending',
  review_note text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id)
);

create index if not exists verification_requests_status_submitted_idx
  on public.verification_requests (status, submitted_at);

do $$ begin
  create type public.live_room_status as enum ('scheduled', 'live', 'ended', 'cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.live_rooms (
  id bigint generated always as identity primary key,
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status public.live_room_status not null default 'scheduled',
  viewer_count integer not null default 0 check (viewer_count >= 0),
  scheduled_at timestamptz,
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists live_rooms_status_created_idx
  on public.live_rooms (status, created_at desc);

do $$ begin
  create type public.content_status as enum ('published', 'hidden', 'removed');
exception when duplicate_object then null;
end $$;

create table if not exists public.content_items (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  title text,
  media_url text,
  thumbnail_url text,
  status public.content_status not null default 'published',
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index if not exists content_items_created_idx
  on public.content_items (created_at desc);

create table if not exists public.user_registration_events (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users(id) on delete cascade,
  ip_address inet,
  ip_hash text,
  platform text not null default 'unknown' check (platform in ('ios', 'android', 'web', 'desktop', 'unknown')),
  app_version text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists user_registration_events_created_idx
  on public.user_registration_events (created_at desc);

alter table public.admin_profiles enable row level security;
alter table public.feature_flags enable row level security;
alter table public.audit_logs enable row level security;
alter table public.verification_requests enable row level security;
alter table public.live_rooms enable row level security;
alter table public.content_items enable row level security;
alter table public.user_registration_events enable row level security;

-- Cuenta propietaria inicial del panel.
insert into public.admin_profiles (user_id, role, mfa_required)
select id, 'superadmin'::public.admin_role, true
from auth.users
where lower(email) = 'noahxdc12@gmail.com'
on conflict (user_id) do update set role = excluded.role, mfa_required = excluded.mfa_required;

-- No crear políticas para clientes móviles sobre estas tablas. El dashboard accede
-- mediante rutas server-side después de validar sesión, rol y MFA.

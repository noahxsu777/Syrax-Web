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

alter table public.admin_profiles enable row level security;
alter table public.feature_flags enable row level security;
alter table public.audit_logs enable row level security;
alter table public.verification_requests enable row level security;

-- No crear políticas para clientes móviles sobre estas tablas. El dashboard accede
-- mediante rutas server-side después de validar sesión, rol y MFA.

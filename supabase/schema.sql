-- Ejecutar en Supabase SQL Editor. Ajusta los campos a las tablas existentes de Vibra.
create type public.admin_role as enum ('support', 'moderator', 'admin', 'superadmin');

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

alter table public.admin_profiles enable row level security;
alter table public.feature_flags enable row level security;
alter table public.audit_logs enable row level security;

-- No crear políticas para clientes móviles sobre estas tablas. El dashboard accede
-- mediante rutas server-side después de validar sesión, rol y MFA.

-- CajaControl: esquema base (sin auth)

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  register_id text not null,
  shift text not null,
  date date not null,
  opened_by text not null,
  opened_at timestamptz not null,
  opening_amount numeric not null,
  opening_bills jsonb,
  opening_coins jsonb,
  status text not null,
  closed_by text,
  closed_at timestamptz,
  closing_amount numeric,
  difference numeric,
  monto_retirado numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.closings (
  id uuid primary key default gen_random_uuid(),
  store_id text not null,
  register_id text not null,
  shift text not null,
  date date not null,
  closed_by text not null,
  closed_at timestamptz not null,
  opening_amount numeric not null,
  ingresos_efectivo numeric not null,
  egresos_efectivo numeric not null,
  ingresos_total numeric not null,
  egresos_total numeric not null,
  expected_cash numeric not null,
  counted_cash numeric not null,
  difference numeric not null,
  monto_retirado numeric not null,
  transferred_out numeric not null default 0,
  admin_withdrawn numeric not null default 0,
  admin_withdrawals jsonb default '[]'::jsonb,
  closing_bills jsonb,
  closing_coins jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.movements (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  amount numeric not null,
  description text not null,
  method text not null,
  category text,
  store_id text not null,
  register_id text not null,
  shift text not null,
  date date not null,
  ts timestamptz not null,
  registered_by text not null,
  is_transfer boolean not null default false,
  from_closing_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.transfers (
  id uuid primary key default gen_random_uuid(),
  from_closing_id uuid,
  from_store text not null,
  from_register text not null,
  from_shift text not null,
  from_date date not null,
  to_store text not null,
  to_register text not null,
  to_shift text not null,
  to_date date not null,
  amount numeric not null,
  executed_by text not null,
  ts timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_name text not null,
  action text not null,
  detail text not null,
  ts timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_shifts_store_date on public.shifts (store_id, date);
create index if not exists idx_closings_store_date on public.closings (store_id, date);
create index if not exists idx_movements_store_date on public.movements (store_id, date);
create index if not exists idx_transfers_to_date on public.transfers (to_date);
create index if not exists idx_audit_ts on public.audit_log (ts);

alter table public.shifts disable row level security;
alter table public.closings disable row level security;
alter table public.movements disable row level security;
alter table public.transfers disable row level security;
alter table public.audit_log disable row level security;

grant usage on schema public to anon;
grant select, insert, update, delete on table public.shifts to anon;
grant select, insert, update, delete on table public.closings to anon;
grant select, insert, update, delete on table public.movements to anon;
grant select, insert, update, delete on table public.transfers to anon;
grant select, insert, update, delete on table public.audit_log to anon;

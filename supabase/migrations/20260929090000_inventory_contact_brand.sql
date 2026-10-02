-- Brand on products, per-variation low-stock threshold, audited stock adjustments,
-- and a contact-form inbox (/contact -> /admin/messages).

alter table public.products add column if not exists brand text;
alter table public.product_variations
  add column if not exists low_stock_threshold integer not null default 5
  check (low_stock_threshold >= 0);

-- ---- stock adjustment history ----
create table public.stock_adjustments (
  id uuid primary key default gen_random_uuid(),
  variation_id uuid not null references public.product_variations(id) on delete cascade,
  delta integer not null check (delta <> 0),
  stock_after integer not null check (stock_after >= 0),
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index stock_adjustments_variation_idx on public.stock_adjustments (variation_id, created_at desc);

alter table public.stock_adjustments enable row level security;
create policy "Admins read stock adjustments" on public.stock_adjustments
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));
-- No insert/update/delete policies: rows are written only by adjust_stock() below.

create or replace function public.adjust_stock(p_variation_id uuid, p_delta integer, p_reason text default null)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_current integer;
  v_new integer;
begin
  if not public.has_role(auth.uid(), 'admin') then
    raise exception 'Not authorized';
  end if;
  if p_delta is null or p_delta = 0 then
    raise exception 'Adjustment must be a non-zero number';
  end if;

  select stock into v_current from public.product_variations where id = p_variation_id for update;
  if not found then
    raise exception 'Variation not found';
  end if;

  v_new := v_current + p_delta;
  if v_new < 0 then
    raise exception 'Stock cannot go below zero (currently %)', v_current;
  end if;

  update public.product_variations set stock = v_new where id = p_variation_id;
  insert into public.stock_adjustments (variation_id, delta, stock_after, reason, created_by)
  values (p_variation_id, p_delta, v_new, nullif(trim(p_reason), ''), auth.uid());

  return v_new;
end;
$$;
revoke all on function public.adjust_stock(uuid, integer, text) from public, anon;
grant execute on function public.adjust_stock(uuid, integer, text) to authenticated;

-- ---- contact form inbox ----
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  phone text check (phone is null or char_length(phone) <= 30),
  email text check (email is null or char_length(email) <= 200),
  message text not null check (char_length(message) between 5 and 2000),
  is_read boolean not null default false,
  created_at timestamptz not null default now(),
  check (phone is not null or email is not null)
);
create index contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
create policy "Anyone can send a contact message" on public.contact_messages
  for insert to anon, authenticated with check (is_read = false);
create policy "Admins manage contact messages" on public.contact_messages
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

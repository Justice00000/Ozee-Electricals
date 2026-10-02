-- Media storage, multi-image products, per-variation images, and admin-configurable delivery zones.

-- ---- Storage bucket for admin uploads (public read, admin-only write) ----
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "Public can read media" on storage.objects
  for select using (bucket_id = 'media');
create policy "Admins manage media" on storage.objects
  for all to authenticated
  using (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'))
  with check (bucket_id = 'media' and public.has_role(auth.uid(), 'admin'));

-- ---- Product gallery + variation image ----
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index product_images_product_id_idx on public.product_images(product_id);

grant select on public.product_images to anon, authenticated;
grant insert, update, delete on public.product_images to authenticated;
grant all on public.product_images to service_role;
alter table public.product_images enable row level security;
create policy "Anyone can view product images" on public.product_images
  for select to anon, authenticated using (true);
create policy "Admins manage product images" on public.product_images
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

alter table public.product_variations add column if not exists image_url text;

-- ---- Delivery zones (no seed data: the client supplies zones and fees) ----
create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee numeric(12,2) not null default 0 check (fee >= 0),
  estimated_time text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.delivery_zones to anon, authenticated;
grant insert, update, delete on public.delivery_zones to authenticated;
grant all on public.delivery_zones to service_role;
alter table public.delivery_zones enable row level security;
create policy "Anyone can view active delivery zones" on public.delivery_zones
  for select to anon, authenticated using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage delivery zones" on public.delivery_zones
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger update_delivery_zones_updated_at before update on public.delivery_zones
  for each row execute function public.update_updated_at_column();

alter table public.orders
  add column if not exists delivery_zone_id uuid references public.delivery_zones(id) on delete set null,
  add column if not exists delivery_zone_name text;

-- ---- create_order: now prices delivery server-side from the chosen zone ----
drop function if exists public.create_order(text, text, text, text, text, text, text, text, text, jsonb);

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_email text,
  p_fulfillment_method text,
  p_delivery_address text,
  p_state text,
  p_city text,
  p_instructions text,
  p_payment_method text,
  p_items jsonb,
  p_delivery_zone_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_user_id uuid := auth.uid();
  v_item record;
  v_variation record;
  v_subtotal numeric(12,2) := 0;
  v_fee numeric(12,2) := 0;
  v_zone_name text := null;
  v_zone record;
  v_has_zones boolean;
begin
  if p_customer_name is null or length(trim(p_customer_name)) = 0 then
    raise exception 'Customer name is required';
  end if;
  if p_customer_phone is null or length(trim(p_customer_phone)) = 0 then
    raise exception 'Customer phone is required';
  end if;
  if p_fulfillment_method not in ('delivery', 'pickup') then
    raise exception 'Invalid fulfillment method';
  end if;
  if p_fulfillment_method = 'delivery' and (p_delivery_address is null or length(trim(p_delivery_address)) = 0) then
    raise exception 'Delivery address is required for delivery orders';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty';
  end if;

  if p_fulfillment_method = 'delivery' then
    select exists (select 1 from public.delivery_zones where is_active) into v_has_zones;
    if v_has_zones then
      if p_delivery_zone_id is null then
        raise exception 'Please choose a delivery zone';
      end if;
      select id, name, fee into v_zone from public.delivery_zones
        where id = p_delivery_zone_id and is_active;
      if v_zone.id is null then
        raise exception 'That delivery zone is not available';
      end if;
      v_fee := v_zone.fee;
      v_zone_name := v_zone.name;
    end if;
  end if;

  for v_item in select * from jsonb_to_recordset(p_items) as x(variation_id uuid, quantity integer)
  loop
    if v_item.variation_id is null or v_item.quantity is null or v_item.quantity < 1 then
      raise exception 'Invalid cart line';
    end if;

    select pv.id, pv.price, pv.stock, pv.is_available, pv.name as variation_name,
           p.id as product_id, p.name as product_name, p.is_available as product_is_available
      into v_variation
      from public.product_variations pv
      join public.products p on p.id = pv.product_id
      where pv.id = v_item.variation_id
      for update of pv;

    if v_variation.id is null then
      raise exception 'A product in your cart no longer exists';
    end if;
    if not v_variation.is_available or not v_variation.product_is_available then
      raise exception '% is no longer available', v_variation.product_name;
    end if;
    if v_variation.stock < v_item.quantity then
      raise exception 'Only % left in stock for %', v_variation.stock, v_variation.product_name;
    end if;

    v_subtotal := v_subtotal + (v_variation.price * v_item.quantity);
  end loop;

  insert into public.orders (
    id, user_id, customer_name, customer_phone, customer_email, fulfillment_method,
    delivery_address, state, city, instructions, payment_method,
    status, subtotal, delivery_fee, total, delivery_zone_id, delivery_zone_name
  ) values (
    v_order_id, v_user_id, trim(p_customer_name), trim(p_customer_phone), nullif(trim(coalesce(p_customer_email, '')), ''),
    p_fulfillment_method, nullif(trim(coalesce(p_delivery_address, '')), ''), p_state, p_city, p_instructions,
    p_payment_method, 'pending', v_subtotal, v_fee, v_subtotal + v_fee,
    case when v_zone_name is not null then p_delivery_zone_id end, v_zone_name
  );

  for v_item in select * from jsonb_to_recordset(p_items) as x(variation_id uuid, quantity integer)
  loop
    select pv.price, pv.name as variation_name, p.id as product_id, p.name as product_name
      into v_variation
      from public.product_variations pv
      join public.products p on p.id = pv.product_id
      where pv.id = v_item.variation_id;

    insert into public.order_items (
      order_id, product_id, variation_id, product_name, variation_name, quantity, unit_price
    ) values (
      v_order_id, v_variation.product_id, v_item.variation_id, v_variation.product_name,
      v_variation.variation_name, v_item.quantity, v_variation.price
    );

    update public.product_variations
      set stock = stock - v_item.quantity
      where id = v_item.variation_id;
  end loop;

  return jsonb_build_object(
    'id', v_order_id,
    'status', 'pending',
    'subtotal', v_subtotal,
    'delivery_fee', v_fee,
    'total', v_subtotal + v_fee,
    'fulfillment_method', p_fulfillment_method,
    'created_at', now(),
    'customer_name', trim(p_customer_name),
    'items', (
      select jsonb_agg(jsonb_build_object(
        'product_name', oi.product_name,
        'variation_name', oi.variation_name,
        'quantity', oi.quantity,
        'unit_price', oi.unit_price
      ))
      from public.order_items oi
      where oi.order_id = v_order_id
    )
  );
end;
$$;

grant execute on function public.create_order(text, text, text, text, text, text, text, text, text, jsonb, uuid)
  to anon, authenticated;

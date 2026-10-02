-- Checkout support: fulfillment method + a security-definer RPC that is the
-- only way orders get created. This keeps the direct `orders`/`order_items`
-- tables admin-only (see the original migration's "Admins manage orders"
-- policies) while still allowing guest checkout, because the function itself
-- validates availability/stock and prices every line from the database
-- rather than trusting whatever the client's cart says.

alter table public.orders
  add column if not exists fulfillment_method text not null default 'delivery'
    check (fulfillment_method in ('delivery', 'pickup'));

-- Pickup orders legitimately have no delivery address.
alter table public.orders
  alter column delivery_address drop not null;

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
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid := gen_random_uuid();
  v_item record;
  v_variation record;
  v_subtotal numeric(12,2) := 0;
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

  -- Lock and validate every line before writing anything.
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
      raise exception 'Only %s left in stock for %s', v_variation.stock, v_variation.product_name;
    end if;

    v_subtotal := v_subtotal + (v_variation.price * v_item.quantity);
  end loop;

  insert into public.orders (
    id, customer_name, customer_phone, customer_email, fulfillment_method,
    delivery_address, state, city, instructions, payment_method,
    status, subtotal, delivery_fee, total
  ) values (
    v_order_id, trim(p_customer_name), trim(p_customer_phone), nullif(trim(coalesce(p_customer_email, '')), ''),
    p_fulfillment_method, nullif(trim(coalesce(p_delivery_address, '')), ''), p_state, p_city, p_instructions,
    p_payment_method, 'pending', v_subtotal, 0, v_subtotal
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
    'delivery_fee', 0,
    'total', v_subtotal,
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

grant execute on function public.create_order(text, text, text, text, text, text, text, text, text, jsonb)
  to anon, authenticated;

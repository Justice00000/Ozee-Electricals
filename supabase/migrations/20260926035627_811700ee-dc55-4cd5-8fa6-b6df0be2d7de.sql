do $$ begin
  create type public.app_role as enum ('admin', 'moderator', 'user');
exception when duplicate_object then null;
end $$;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users can view their own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "Anyone can view active categories" on public.categories
  for select to anon, authenticated using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage categories" on public.categories
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text not null unique,
  description text,
  specs jsonb not null default '{}'::jsonb,
  warranty text,
  image_url text,
  is_featured boolean not null default false,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant all on public.products to service_role;
alter table public.products enable row level security;
create policy "Anyone can view available products" on public.products
  for select to anon, authenticated using (is_available or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage products" on public.products
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.product_variations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  sku text,
  attributes jsonb not null default '{}'::jsonb,
  price numeric(12,2) not null default 0,
  stock integer not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.product_variations to anon, authenticated;
grant insert, update, delete on public.product_variations to authenticated;
grant all on public.product_variations to service_role;
alter table public.product_variations enable row level security;
create policy "Anyone can view available variations" on public.product_variations
  for select to anon, authenticated using (is_available or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage variations" on public.product_variations
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
grant all on public.services to service_role;
alter table public.services enable row level security;
create policy "Anyone can view active services" on public.services
  for select to anon, authenticated using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage services" on public.services
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "Anyone can view site settings" on public.site_settings
  for select to anon, authenticated using (true);
create policy "Admins manage site settings" on public.site_settings
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  delivery_address text not null,
  state text,
  city text,
  instructions text,
  payment_method text,
  status text not null default 'pending',
  subtotal numeric(12,2) not null default 0,
  delivery_fee numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.orders to authenticated;
grant all on public.orders to service_role;
alter table public.orders enable row level security;
create policy "Admins manage orders" on public.orders
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  variation_id uuid references public.product_variations(id) on delete set null,
  product_name text not null,
  variation_name text,
  quantity integer not null default 1,
  unit_price numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.order_items to authenticated;
grant all on public.order_items to service_role;
alter table public.order_items enable row level security;
create policy "Admins manage order items" on public.order_items
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public
as $$ begin new.updated_at = now(); return new; end; $$;
create trigger update_categories_updated_at before update on public.categories for each row execute function public.update_updated_at_column();
create trigger update_products_updated_at before update on public.products for each row execute function public.update_updated_at_column();
create trigger update_product_variations_updated_at before update on public.product_variations for each row execute function public.update_updated_at_column();
create trigger update_services_updated_at before update on public.services for each row execute function public.update_updated_at_column();
create trigger update_site_settings_updated_at before update on public.site_settings for each row execute function public.update_updated_at_column();
create trigger update_orders_updated_at before update on public.orders for each row execute function public.update_updated_at_column();

insert into public.categories (name, slug, description, sort_order) values
  ('Lighting', 'lighting', 'Chandeliers, indoor and outdoor lights, ceiling, pendant, profile and magnetic lighting.', 1),
  ('Switches & Sockets', 'switches-sockets', 'Reliable switches, sockets, USB points and TV outlets for every space.', 2),
  ('Electrical Control', 'electrical-control', 'Gear switches and changeover solutions for safe electrical control.', 3),
  ('Wires & Cables', 'wires-cables', 'Quality cables by type, size, length and brand.', 4),
  ('Solar & Renewable', 'solar-renewable', 'Inverters, lithium batteries, panels, charge controllers and accessories.', 5)
on conflict (slug) do nothing;

insert into public.products (category_id, name, slug, description, specs, warranty, image_url, is_featured)
select c.id, p.name, p.slug, p.description, p.specs, p.warranty, p.image_url, true
from (values
  ('switches-sockets', 'Switch & Socket Range', 'switch-socket-range', 'Clean, dependable switches and sockets for modern homes and commercial spaces.', '{"range":"1–4 gang","finish":"Modern white","use":"Indoor"}'::jsonb, '12 months', '/src/assets/ozee-switch.jpg'),
  ('solar-renewable', 'Solar Panel', 'solar-panel', 'Efficient solar panels for dependable renewable power systems.', '{"range":"100W–550W","technology":"Monocrystalline","use":"Solar systems"}'::jsonb, '12 months', '/src/assets/ozee-solar.jpg'),
  ('lighting', 'Crystal Chandelier', 'crystal-chandelier', 'Statement lighting that brings a polished finish to living rooms, foyers and dining spaces.', '{"style":"Crystal","mount":"Ceiling","use":"Indoor"}'::jsonb, '12 months', '/src/assets/ozee-chandelier.jpg'),
  ('solar-renewable', 'Lithium Battery', 'lithium-battery', 'Reliable energy storage for solar installations and backup power.', '{"range":"5kWh–15kWh","chemistry":"Lithium","use":"Energy storage"}'::jsonb, '24 months', '/src/assets/ozee-battery.jpg')
) as p(category_slug, name, slug, description, specs, warranty, image_url)
join public.categories c on c.slug = p.category_slug
on conflict (slug) do nothing;

insert into public.product_variations (product_id, name, attributes, price, stock)
select p.id, v.name, v.attributes, v.price, v.stock
from (values
  ('switch-socket-range', '1 Gang', '{"gang":"1"}'::jsonb, 1350, 50),
  ('switch-socket-range', 'USB Double + 2 USB', '{"gang":"2","feature":"2 USB ports"}'::jsonb, 5950, 25),
  ('solar-panel', '100W Panel', '{"wattage":"100W"}'::jsonb, 85000, 12),
  ('solar-panel', '550W Panel', '{"wattage":"550W"}'::jsonb, 245000, 8),
  ('crystal-chandelier', 'Standard Chandelier', '{"size":"Standard"}'::jsonb, 42000, 6),
  ('lithium-battery', '5kWh Battery', '{"capacity":"5kWh"}'::jsonb, 320000, 4),
  ('lithium-battery', '15kWh Battery', '{"capacity":"15kWh"}'::jsonb, 895000, 2)
) as v(product_slug, name, attributes, price, stock)
join public.products p on p.slug = v.product_slug;

insert into public.services (title, description, sort_order) values
  ('Electrical Installation', 'Wiring, sockets and safe electrical setups.', 1),
  ('Solar Setup', 'Inverters, panels and batteries installed for your needs.', 2),
  ('Repairs & Maintenance', 'Fast, reliable fixes on site or at your property.', 3);

insert into public.site_settings (key, value) values
  ('business', '{"name":"Ozee Electrical","phone_primary":"08135348536","phone_secondary":"08036424443","email":"ozeeelectricals@gmail.com","address":"Block 29/25, Alaba International Market, Ojo, Lagos","whatsapp":"2348135348536","tiktok":"Ozee_electricals","facebook":"Ozee Electrical"}'::jsonb),
  ('homepage', '{"hero_title":"Power, Light & Solar","hero_description":"Premium electricals, lighting and renewable energy for homes and businesses across Lagos.","hero_image":"/src/assets/ozee-showroom.jpg"}'::jsonb),
  ('delivery', '{"pickup":"Pickup available from Alaba International Market","note":"Delivery zones and fees can be updated here."}'::jsonb)
on conflict (key) do nothing;
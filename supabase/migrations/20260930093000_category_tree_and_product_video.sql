-- Unlimited-depth categories (Lighting -> Indoor Lighting -> Ceiling Lights -> ...)
-- and an optional showcase video per product.

alter table public.categories
  add column if not exists parent_id uuid references public.categories(id) on delete cascade;

alter table public.categories
  add constraint categories_parent_not_self check (parent_id is distinct from id);

create index if not exists categories_parent_id_idx on public.categories (parent_id);

alter table public.products add column if not exists video_url text;

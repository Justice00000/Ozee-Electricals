-- Content pages support: services get a slug + detail content for /service/:slug,
-- and two new admin-manageable tables (faqs, policies) back /faq and the policy pages.

-- ---- services: add slug + longer detail content ----
alter table public.services add column if not exists slug text;
alter table public.services add column if not exists content text;
alter table public.services add column if not exists pricing_note text;

update public.services
set slug = trim(both '-' from lower(regexp_replace(title, '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null or slug = '';

alter table public.services alter column slug set not null;
alter table public.services add constraint services_slug_key unique (slug);

-- ---- faqs ----
create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.faqs to anon, authenticated;
grant insert, update, delete on public.faqs to authenticated;
grant all on public.faqs to service_role;

alter table public.faqs enable row level security;

create policy "Anyone can view active faqs" on public.faqs
  for select to anon, authenticated using (is_active or public.has_role(auth.uid(), 'admin'));
create policy "Admins manage faqs" on public.faqs
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger update_faqs_updated_at before update on public.faqs
  for each row execute function public.update_updated_at_column();

-- ---- policies (fixed set of slugs: privacy-policy, terms, returns, warranty) ----
create table public.policies (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  content text not null default '',
  updated_at timestamptz not null default now()
);

grant select on public.policies to anon, authenticated;
grant insert, update, delete on public.policies to authenticated;
grant all on public.policies to service_role;

alter table public.policies enable row level security;

create policy "Anyone can view policies" on public.policies
  for select to anon, authenticated using (true);
create policy "Admins manage policies" on public.policies
  for all to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create trigger update_policies_updated_at before update on public.policies
  for each row execute function public.update_updated_at_column();

-- Placeholder content only — real policy text must come from Ozee Electrical, never invented here.
insert into public.policies (slug, title, content) values
  ('privacy-policy', 'Privacy Policy', 'This page is a placeholder. Ozee Electrical has not yet provided privacy policy text — edit this in Admin → Policies once available.'),
  ('terms', 'Terms & Conditions', 'This page is a placeholder. Ozee Electrical has not yet provided terms & conditions text — edit this in Admin → Policies once available.'),
  ('returns', 'Return / Refund Policy', 'This page is a placeholder. Ozee Electrical has not yet provided a returns/refund policy — edit this in Admin → Policies once available.'),
  ('warranty', 'Warranty Policy', 'This page is a placeholder. Ozee Electrical has not yet provided warranty policy text — edit this in Admin → Policies once available.')
on conflict (slug) do nothing;

-- ---- about page content (site_settings key), left minimal and factual, not invented ----
insert into public.site_settings (key, value) values
  ('about', '{"intro":"Add a short introduction to Ozee Electrical in Admin \u2192 About."}'::jsonb)
on conflict (key) do nothing;

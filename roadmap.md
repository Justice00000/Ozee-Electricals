# Ozee Electrical roadmap

- [x] Build the branded customer storefront home experience
- [x] Add generated showroom and product imagery
- [x] Add category filtering and cart feedback interactions
- [x] Add Lovable Cloud catalog, variations, stock schema (categories, products, product_variations, services, site_settings, orders, order_items, user_roles + RLS)
- [x] Add dedicated shop, category, product detail, and cart pages wired to real Supabase data
- [x] Real persistent cart (variation-aware, localStorage) replacing the prototype counter
- [x] Add checkout (delivery/pickup, bank transfer/pay-on-delivery) and a secure `create_order` RPC that re-validates stock/availability and re-prices every line server-side
- [x] Add order-confirmation page (session-scoped; no public order lookup endpoint was added, by design — see security note below)
- [x] Add authenticated admin dashboard (products, categories, orders, stats) and business-owner CRUD for the catalog
- [x] Add editable homepage/business-info CMS (`/admin/homepage`, `/admin/business`) — hero title/description/image and business contact info now editable without SQL; the "change phone number → save → website updates" and "change hero image → save → homepage updates" flows from the brief work end to end
- [x] Wire in the real Ozee/Zee Electrical logo (navbar, footer, admin sidebar, login page) — replaces the placeholder "O" badge
- [x] Add about/services/contact/FAQ/policy pages (`/about`, `/services`, `/service/:slug`, `/contact`, `/faq`, `/privacy-policy`, `/terms`, `/returns`, `/warranty`) plus matching admin management (`/admin/services`, `/admin/faqs`, `/admin/policies`, and an About-intro field on `/admin/homepage`)
- [x] Motion & polish pass: route transitions (fade/slide, keyed on pathname), scroll-reveal + staggered product cards, staggered hero entrance, button press feedback, cart badge bump, animated price/variation swap, route-pending skeleton, global `prefers-reduced-motion` support. CSS transform/opacity only, no new dependencies. Not yet checked visually in a browser.
- [ ] Real payment provider integration (Paystack/Flutterwave) — order total is currently informational only, confirmed by phone/WhatsApp
- [x] Delivery zones: `/admin/delivery` CRUD (name, fee, estimated time). No seed data. With no active zones checkout says the fee is confirmed by phone (₦0 recorded); once zones exist, customers must pick one and `create_order` prices the fee server-side. Pickup is always free
- [x] Customer accounts: `/account/login`, `/account/register`, `/account`, `/orders`, `/orders/:id`. Guest checkout still works; signed-in orders are linked via `orders.user_id` and readable only by their owner (owner-scoped RLS, no public order lookup)
- [x] Homepage hero video (+ poster) with image fallback, chosen in `/admin/homepage`; paused for reduced-motion users
- [x] Supabase Storage `media` bucket (public read, admin-only write) with upload buttons on product/variation/gallery, category, service and homepage forms; multi-image product gallery with thumbnails; variation-specific images
- [x] Favicon, apple-touch icon and app icons generated from the real logo. `public/og-image.png` exists but og:image needs an absolute URL, so add it in `__root.tsx` once the production domain is known
- [ ] No contact form on `/contact` — deliberately skipped since there's no backend to receive submissions yet (would need an edge function or a form service); phone/email/WhatsApp all work today
- [ ] Policy pages ship with clearly-labelled placeholder text ("Ozee Electrical has not yet provided…") — real legal/policy copy must come from the client and be entered via `/admin/policies`, never invented

- [x] SEO: per-page title/description/og tags for products, categories and services; Product JSON-LD structured data on product pages

## Production review (static; not yet run against a live project)
Done: typecheck/lint/build clean; `npm audit` clean on install; jsx-a11y audit (remaining hits are false positives for
labels wrapping Radix radio items); fixed render-time navigation in the admin/account guards; skip-to-content link;
FAQ uses client-side links; shop search now matches every word across product, category and variation names
("4 gang switch"), plus price range, in-stock filter and load-more; server-side hardening above.
Found and fixed in review: split cart lines could have dodged the per-line stock check; cancelling an order did not
return stock; order status was unconstrained.
Known gaps / not verified:
- Nothing here has been exercised against a real Supabase project or in a browser (sandbox has neither). First
  real click-through of checkout, admin CRUD, uploads and RLS is still to do — expect small fixes.
- No order email/SMS notifications; the owner sees orders only in `/admin/orders`.
- Cart shows the price/stock captured when an item was added; checkout re-prices server-side, so the total charged
  can differ from what the cart displayed if prices changed.
- No shared-image transition between shop and product, and no animated nav active indicator.
- Uploads are stored as-is (10 MB cap, no compression/resizing), so large photos will slow pages down.
- Payment gateway deferred by request.

## Added in the completion pass
- `/admin/inventory` (per-variation stock, low/out filters, audited adjustments via `adjust_stock` RPC, per-variation low-stock threshold), `/admin/customers` (derived from real orders, no separate data), `/admin/messages` (inbox for the new contact form).
- Contact form on `/contact` -> `contact_messages` (RLS: anyone can insert with length checks; admin-only read). No rate limiting/captcha yet.
- Product `brand` field (admin form + product page), product share button (native share, clipboard fallback). Dashboard low-stock count now uses each variation's own threshold.
- Still open: payment provider, promotions/banners, variation attribute UI + wattage/capacity filters, order notifications, image compression, shared-image transition, nav active indicator, wishlist, `/admin/media` + `/admin/settings` pages.
- Homepage hero reworked to a full-bleed background video/image (was a boxed card beside the text) — `HeroVideo` now takes a `className` so it can fill the whole hero, with a gradient scrim for text legibility. Uses the same `hero_media`/`hero_video`/`hero_poster`/`hero_image` fields from `/admin/homepage`, no schema change.
- Reported bug (not reproduced here — this sandbox's network can't reach Supabase, so admin pages here only render as an infinite loading spinner, which isn't the reported symptom): clicking admin nav links updates the URL but not the page, and a hard refresh doesn't fix it. Code review of the router, `_admin` guard and every `Link` turned up nothing wrong, and there's no service worker/PWA caching in the app. Next step is a browser console/network-tab capture from the moment it happens.

## Migrations to run
Six SQL migrations exist beyond the original schema (the newest, `20260929090000_inventory_contact_brand.sql`, adds brand, low_stock_threshold, stock_adjustments/adjust_stock and contact_messages) — run all of them, in order, against your Supabase project if you haven't:
`20260926072710_add_order_creation.sql` (checkout/`create_order`) and `20260927044308_add_content_pages.sql`
(service slugs + detail content, `faqs` table, `policies` table, `about` site setting), and
`20260927211308_add_customer_accounts.sql` (`orders.user_id`, owner-scoped SELECT policies, `create_order` now stamps `auth.uid()`), and
`20260928050000_add_media_gallery_delivery.sql` (Storage bucket + policies, `product_images`, variation `image_url`, `delivery_zones`, `create_order` with zone pricing; also fixes a cosmetic `%s` typo in the low-stock error message), and
`20260928120000_production_hardening.sql` (stock can't go negative, order status constraint, cancelling an order returns its stock / re-opening re-reserves it, `create_order` merges duplicate cart lines). Via the Lovable
Cloud/Supabase SQL editor, or `supabase db push` if you use the CLI locally.

## Provisioning the first admin login (do this once)
There's no public admin sign-up (correctly so — self-serve admin accounts would be a security hole). To create
the first admin:
1. In the Supabase/Lovable Cloud dashboard → Authentication → Users → add a user with an email + password.
   That's the login for `/admin/login`.
2. Copy that user's UUID from the same Users table.
3. In the SQL editor, run: `insert into public.user_roles (user_id, role) values ('<uuid>', 'admin');`
4. Sign in at `/admin/login`. Everything past that point (granting further admins, revoking access) can be done
   the same way, or by an existing admin — there's no admin UI for role management yet, on purpose, since it's
   a rare, high-stakes action better done directly in SQL than exposed as a button.

## Security note on orders
`orders`/`order_items` are still admin-only for direct table access (original RLS intact). The only way a
customer creates an order is the `public.create_order` SECURITY DEFINER function, which validates stock,
availability and price from the database (never trusts the client cart) inside one transaction, then decrements
stock. There is deliberately no public "fetch an order by id" endpoint yet — the confirmation page reads the
order back from `sessionStorage`, written right after a successful order, so no policy exists that would let
anyone enumerate other customers' orders. A future `/orders` (Phase 9, customer accounts) should read via an
authenticated, owner-scoped policy rather than widening `orders` SELECT to `anon`.
## This pass (routing fix, nested categories, hero gallery, admin responsiveness)

- **Root-cause fix for the admin "URL changes, page doesn't" bug**: `_admin/admin.tsx` (Dashboard) had no `<Outlet/>`, but TanStack Router's dot-notation file routing makes `admin.tsx` the implicit parent layout for every `admin.*.tsx` sibling (products, orders, customers, inventory, etc.) — all 14 of them. Without an Outlet there, the router's match state was correct (right URL, right active nav) but nothing ever rendered those children; the Dashboard just kept showing. Verified by reproducing it live (fresh server, first-ever request, zero caching involved) and confirming the fix. Renamed the file to `admin.index.tsx` (route `/_admin/admin/`) so it's a sibling index instead of an implicit parent. This fixes every admin sub-page at once, not just the ones added in earlier passes.
- Unlimited-depth categories: `categories.parent_id` (self-referencing, migration `20260930093000_category_tree_and_product_video.sql`), `src/lib/category-tree.ts` helpers (root categories, children, all-descendants, breadcrumb ancestors, indented tree flattening — computed client-side, no DB functions needed). `/category/$slug` shows breadcrumbs + subcategory tiles + all descendant products; `/categories` shows root categories with subcategory pills; homepage category tiles are root-only; shop page filter chips show root categories plus a second row of subcategories once one is picked, and filtering includes the whole subtree. Admin: category form has a parent picker (can't pick your own descendant), category list renders as an indented tree with a quick "add subcategory" button, product form's category dropdown is indented by depth.
- Hero: homepage hero can now be a single image, a full-bleed video, or **rotating photos** (new `hero_images: string[]` + `hero_media: "gallery"` in the `homepage` site_settings JSON — no migration needed since it's JSONB) that crossfade automatically via `HeroGallery`. Managed from `/admin/homepage`.
- Products can have an optional showcase video (`products.video_url`, same migration as categories); product detail gallery can switch to it, product cards crossfade through extra photos on hover (respects reduced-motion) with a small video badge.
- Admin responsiveness: mobile admin nav is now a proper slide-in drawer (Sheet) instead of a horizontally-scrolling pill row, with a sticky header showing the current section name; desktop sidebar scrolls independently if it outgrows the viewport. All admin tables already wrap in `overflow-x-auto`; the product form is a full page (not a cramped dialog), so it was already mobile-friendly.
- Still open: payment provider, promotions/banners, variation attribute UI + wattage/capacity filters, order notifications, `/admin/media` + `/admin/settings` pages, wishlist.

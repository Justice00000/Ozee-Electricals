import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MessageCircle, Sparkles, Wrench, Zap, type LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { HeroGallery } from "@/components/storefront/hero-gallery";
import { HeroVideo } from "@/components/storefront/hero-video";
import { ProductCard, ProductCardSkeleton } from "@/components/storefront/product-card";
import { getRootCategories } from "@/lib/category-tree";
import { resolveImage, showroomImage } from "@/lib/images";
import {
  categoriesQueryOptions,
  featuredProductsQueryOptions,
  servicesQueryOptions,
  siteSettingsQueryOptions,
  whatsappLink,
} from "@/lib/queries";

const SERVICE_ICONS: LucideIcon[] = [Zap, Sparkles, Wrench];

export const Route = createFileRoute("/_storefront/")({
  head: () => ({
    meta: [
      { title: "Ozee Electrical | Power, Light & Solar in Lagos" },
      {
        name: "description",
        content:
          "Shop switches, sockets, chandeliers, solar panels, lithium batteries and cables from Ozee Electrical, Alaba International Market, Lagos.",
      },
    ],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
      context.queryClient.ensureQueryData(featuredProductsQueryOptions()),
      context.queryClient.ensureQueryData(servicesQueryOptions()),
      context.queryClient.ensureQueryData(siteSettingsQueryOptions()),
    ]);
  },
  component: Home,
});

function Home() {
  const { data: allCategories } = useQuery(categoriesQueryOptions());
  const categories = allCategories ? getRootCategories(allCategories) : allCategories;
  const { data: featuredProducts, isLoading: productsLoading } = useQuery(
    featuredProductsQueryOptions(),
  );
  const { data: services } = useQuery(servicesQueryOptions());
  const { data: settings } = useQuery(siteSettingsQueryOptions());

  const homepage = settings?.homepage;
  const business = settings?.business;

  return (
    <div className="page-shell relative overflow-hidden">
      {/* Hero: full-bleed video/image with the headline overlaid on top */}
      <section className="relative isolate flex min-h-[520px] items-center overflow-hidden sm:min-h-[600px] md:min-h-[680px]">
        <div
          className="animate-in fade-in fill-mode-both motion-reduce:animate-none absolute inset-0 duration-1000"
          aria-hidden={homepage?.hero_media === "video" && !!homepage.hero_video}
        >
          {homepage?.hero_media === "video" && homepage.hero_video ? (
            <HeroVideo
              src={homepage.hero_video}
              poster={resolveImage(homepage.hero_poster ?? homepage.hero_image ?? showroomImage)}
              className="h-full w-full object-cover"
            />
          ) : homepage?.hero_media === "gallery" &&
            homepage.hero_images &&
            homepage.hero_images.length > 0 ? (
            <HeroGallery images={homepage.hero_images} alt="Ozee Electrical showroom" />
          ) : (
            <img
              src={resolveImage(homepage?.hero_image ?? showroomImage)}
              alt="Ozee Electrical showroom"
              className="h-full w-full object-cover"
            />
          )}
          {/* Scrim: keeps the headline and CTAs readable over any footage */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/10 to-transparent" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-6xl px-4 py-16 sm:px-8">
          <div className="max-w-xl">
            <span
              style={{ animationDelay: "0ms" }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm"
            >
              <Sparkles className="h-3.5 w-3.5" /> Alaba International Market, Lagos
            </span>
            <h1
              style={{ animationDelay: "100ms" }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl md:text-6xl"
            >
              {homepage?.hero_title ?? "Power, Light & Solar"}
            </h1>
            <p
              style={{ animationDelay: "200ms" }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none mt-4 max-w-md text-base text-white/85"
            >
              {homepage?.hero_description ??
                "Premium electricals, lighting and renewable energy for homes and businesses across Lagos."}
            </p>
            <div
              style={{ animationDelay: "300ms" }}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both motion-reduce:animate-none mt-6 flex flex-wrap gap-3"
            >
              <Button variant="brand" size="lg" className="rounded-full" asChild>
                <Link to="/shop">
                  Shop Products <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              {business && (
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                  asChild
                >
                  <a
                    href={whatsappLink(business, "Hi, I'd like to ask about your products.")}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="mr-1.5 h-4 w-4" /> Chat on WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-[560px] h-72 w-72 rounded-full bg-cyan/35 blur-3xl sm:top-[640px] md:top-[720px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-100px] top-[900px] h-80 w-80 rounded-full bg-bright/20 blur-3xl"
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-8">
        {/* Categories */}
        {categories && categories.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">Shop by category</h2>
              <Link to="/categories" className="text-sm font-medium text-brand hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border/60 bg-card p-4 text-center transition-shadow hover:shadow-md"
                >
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-cyan/20 text-brand transition-transform group-hover:scale-110">
                    <Zap className="h-5 w-5" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{category.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Featured products */}
        <section className="mt-20">
          <div className="flex items-end justify-between">
            <h2 className="font-display text-2xl font-bold text-foreground">Featured products</h2>
            <Link to="/shop" className="text-sm font-medium text-brand hover:underline">
              Browse shop
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {productsLoading &&
              Array.from({ length: 4 }).map((_, index) => <ProductCardSkeleton key={index} />)}
            {featuredProducts?.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
          {!productsLoading && featuredProducts?.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              No featured products yet — check the full shop for everything in stock.
            </p>
          )}
        </section>

        {/* Services */}
        {services && services.length > 0 && (
          <section className="mt-20">
            <div className="flex items-end justify-between">
              <h2 className="font-display text-2xl font-bold text-foreground">Services</h2>
              <Link to="/services" className="text-sm font-medium text-brand hover:underline">
                View all
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              {services.map((service, index) => {
                const Icon = SERVICE_ICONS[index % SERVICE_ICONS.length] ?? Zap;
                return (
                  <Link
                    key={service.id}
                    to="/service/$slug"
                    params={{ slug: service.slug }}
                    className="glass-surface block rounded-2xl p-5 transition-shadow hover:shadow-md"
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-brand/10 text-brand">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-3 font-display text-base font-semibold text-foreground">
                      {service.title}
                    </h3>
                    {service.description && (
                      <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* About teaser */}
        <section className="mt-20 grid gap-6 rounded-3xl border border-border/60 bg-card p-8 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="font-display text-2xl font-bold text-foreground">
              A trusted name in Lagos electricals
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              From Alaba International Market, {business?.name ?? "Ozee Electrical"} supplies
              switches, sockets, lighting, cables and solar equipment for homes, shops and
              businesses.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button variant="outline" className="rounded-full" asChild>
                <Link to="/shop">
                  Browse the shop <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="ghost" className="rounded-full" asChild>
                <Link to="/about">More about us</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

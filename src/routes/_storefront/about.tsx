import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import { categoriesQueryOptions, siteSettingsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/about")({
  head: () => ({ meta: [{ title: "About | Ozee Electrical" }] }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(siteSettingsQueryOptions()),
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
  component: AboutPage,
});

function AboutPage() {
  const { data: settings } = useQuery(siteSettingsQueryOptions());
  const { data: categories } = useQuery(categoriesQueryOptions());
  const business = settings?.business;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan/20 px-3 py-1 text-xs font-semibold text-brand">
        <MapPin className="h-3.5 w-3.5" /> Alaba International Market, Lagos
      </span>
      <h1 className="mt-4 font-display text-4xl font-bold text-foreground">
        About {business?.name ?? "Ozee Electrical"}
      </h1>

      {settings?.about?.intro && (
        <p className="mt-5 max-w-2xl text-base text-muted-foreground">{settings.about.intro}</p>
      )}

      {categories && categories.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-xl font-bold text-foreground">What we supply</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-brand/40"
              >
                <Zap className="h-4 w-4 text-brand" /> {category.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="font-display text-xl font-bold text-foreground">Where to find us</h2>
        {business?.address && (
          <p className="mt-2 text-sm text-muted-foreground">{business.address}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="brand" className="rounded-full" asChild>
            <Link to="/shop">
              Shop products <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" className="rounded-full" asChild>
            <Link to="/contact">Get in touch</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

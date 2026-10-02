import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Wrench } from "lucide-react";

import { EmptyState } from "@/components/storefront/empty-state";
import { resolveImage } from "@/lib/images";
import { servicesQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/services")({
  head: () => ({ meta: [{ title: "Services | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(servicesQueryOptions()),
  component: ServicesPage,
});

function ServicesPage() {
  const { data: services, isLoading } = useQuery(servicesQueryOptions());

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Services</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Installation, solar setup and repairs from the Ozee Electrical team.
      </p>

      {!isLoading && services?.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Wrench}
            title="No services published yet"
            description="Check back soon."
          />
        </div>
      )}

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {services?.map((service) => (
          <Link
            key={service.id}
            to="/service/$slug"
            params={{ slug: service.slug }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-shadow hover:shadow-md"
          >
            {service.image_url && (
              <div className="aspect-[16/10] overflow-hidden bg-secondary">
                <img
                  src={resolveImage(service.image_url)}
                  alt={service.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            <div className="flex flex-1 flex-col p-5">
              <h2 className="font-display text-lg font-semibold text-foreground">
                {service.title}
              </h2>
              {service.description && (
                <p className="mt-1.5 text-sm text-muted-foreground">{service.description}</p>
              )}
              <span className="mt-auto flex items-center gap-1 pt-4 text-sm font-medium text-brand">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

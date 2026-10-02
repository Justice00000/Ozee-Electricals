import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { resolveImage } from "@/lib/images";
import { serviceBySlugQueryOptions, siteSettingsQueryOptions, whatsappLink } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/service/$slug")({
  loader: async ({ context, params }) => {
    const service = await context.queryClient.ensureQueryData(
      serviceBySlugQueryOptions(params.slug),
    );
    if (!service) throw notFound();
    return service;
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.title} | Ozee Electrical`
      : "Service | Ozee Electrical";
    const description =
      loaderData?.description ?? "Electrical and solar services from Ozee Electrical, Lagos.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: ServiceDetailPage,
});

function ServiceDetailPage() {
  const { slug } = Route.useParams();
  const { data: service } = useSuspenseQuery(serviceBySlugQueryOptions(slug));
  const { data: settings } = useQuery(siteSettingsQueryOptions());

  if (!service) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <Link
        to="/services"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All services
      </Link>

      {service.image_url && (
        <div className="mt-4 aspect-[16/9] overflow-hidden rounded-2xl bg-secondary">
          <img
            src={resolveImage(service.image_url)}
            alt={service.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <h1 className="mt-6 font-display text-3xl font-bold text-foreground">{service.title}</h1>
      {service.description && (
        <p className="mt-3 text-base text-muted-foreground">{service.description}</p>
      )}
      {service.content && (
        <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
          {service.content}
        </div>
      )}
      {service.pricing_note && (
        <p className="mt-4 rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
          {service.pricing_note}
        </p>
      )}

      {settings?.business && (
        <Button variant="brand" size="lg" className="mt-6 rounded-full" asChild>
          <a
            href={whatsappLink(
              settings.business,
              `Hi, I'd like to ask about your "${service.title}" service.`,
            )}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="mr-1.5 h-4 w-4" /> Ask about this service
          </a>
        </Button>
      )}
    </div>
  );
}

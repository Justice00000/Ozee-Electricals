import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { Minus, MessageCircle, Play, Plus, Share2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { HeroVideo } from "@/components/storefront/hero-video";
import { ProductCard } from "@/components/storefront/product-card";
import { useCart } from "@/context/cart-context";
import { resolveImage } from "@/lib/images";
import { formatNaira, stockLabel, stockLevel } from "@/lib/format";
import {
  productBySlugQueryOptions,
  productsByCategoryQueryOptions,
  siteSettingsQueryOptions,
  whatsappLink,
} from "@/lib/queries";

export const Route = createFileRoute("/_storefront/product/$slug")({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(
      productBySlugQueryOptions(params.slug),
    );
    if (!product) throw notFound();
    if (product.category_id) {
      await context.queryClient.ensureQueryData(
        productsByCategoryQueryOptions(product.category_id),
      );
    }
    return product;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.name} | Ozee Electrical` : "Product | Ozee Electrical";
    const description =
      loaderData?.description ??
      "Electrical, lighting and solar products from Ozee Electrical, Lagos.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(loaderData?.image_url && loaderData.image_url.startsWith("http")
          ? [{ property: "og:image", content: loaderData.image_url }]
          : []),
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productBySlugQueryOptions(slug));
  const { data: settings } = useQuery(siteSettingsQueryOptions());
  const { addItem } = useCart();
  const navigate = useNavigate();

  const availableVariations = useMemo(
    () => product?.product_variations.filter((v) => v.is_available) ?? [],
    [product],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(availableVariations[0]?.id);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);

  const galleryUrls = useMemo(() => {
    const urls = [
      product?.image_url ?? null,
      ...[...(product?.product_images ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((entry) => entry.url),
    ].filter((url): url is string => Boolean(url));
    return [...new Set(urls)];
  }, [product]);

  const relatedQuery = useQuery({
    ...productsByCategoryQueryOptions(product?.category_id ?? ""),
    enabled: Boolean(product?.category_id),
  });

  useEffect(() => {
    if (product) document.title = `${product.name} | Ozee Electrical`;
  }, [product]);

  if (!product) return null;

  const selectedVariation =
    availableVariations.find((v) => v.id === selectedId) ?? availableVariations[0] ?? null;
  const level = stockLevel(selectedVariation?.stock ?? 0);
  const image = resolveImage(activeImage ?? selectedVariation?.image_url ?? galleryUrls[0] ?? null);
  const specs = (product.specs ?? {}) as Record<string, unknown>;
  const specEntries = Object.entries(specs).filter(([, value]) => value !== null && value !== "");
  const related = (relatedQuery.data ?? []).filter((p) => p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    if (!selectedVariation) return;
    addItem(
      {
        variationId: selectedVariation.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variationName: selectedVariation.name,
        price: selectedVariation.price,
        image,
        maxStock: selectedVariation.stock,
      },
      quantity,
    );
    toast.success(`${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    void navigate({ to: "/cart" });
  };

  const prices = availableVariations.map((v) => v.price);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description ?? undefined,
    image: galleryUrls.filter((url) => url.startsWith("http")),
    ...(prices.length > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "NGN",
            lowPrice: Math.min(...prices),
            highPrice: Math.max(...prices),
            availability: availableVariations.some((v) => v.stock > 0)
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className="glass-surface aspect-square overflow-hidden rounded-3xl">
            {showVideo && product.video_url ? (
              <HeroVideo
                key="video"
                src={product.video_url}
                poster={image}
                className="value-swap h-full w-full object-cover"
              />
            ) : (
              <img
                key={image}
                src={image}
                alt={product.name}
                className="value-swap h-full w-full object-cover"
              />
            )}
          </div>
          {(galleryUrls.length > 1 || product.video_url) && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.video_url && (
                <button
                  type="button"
                  aria-label="Play product video"
                  onClick={() => setShowVideo(true)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    showVideo ? "border-brand" : "border-transparent"
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 grid place-items-center bg-black/30">
                    <Play className="h-5 w-5 fill-white text-white" />
                  </span>
                </button>
              )}
              {galleryUrls.map((url) => (
                <button
                  key={url}
                  type="button"
                  aria-label="Show image"
                  onClick={() => {
                    setShowVideo(false);
                    setActiveImage(url);
                  }}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-colors ${
                    !showVideo && image === resolveImage(url)
                      ? "border-brand"
                      : "border-transparent"
                  }`}
                >
                  <img src={resolveImage(url)} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.categories && (
            <Link
              to="/category/$slug"
              params={{ slug: product.categories.slug }}
              className="text-xs font-semibold uppercase tracking-wide text-brand hover:underline"
            >
              {product.categories.name}
            </Link>
          )}
          <h1 className="mt-2 font-display text-3xl font-bold text-foreground">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3">
            <span
              key={selectedVariation?.id}
              className="value-swap font-display text-2xl font-bold text-brand"
            >
              {selectedVariation ? formatNaira(selectedVariation.price) : "Unavailable"}
            </span>
            {selectedVariation && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  level === "out-of-stock"
                    ? "bg-destructive/10 text-destructive"
                    : level === "low-stock"
                      ? "bg-bright/15 text-brand"
                      : "bg-mint/20 text-brand"
                }`}
              >
                {stockLabel(selectedVariation.stock)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-4 text-sm text-muted-foreground">{product.description}</p>
          )}

          {availableVariations.length > 0 && (
            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {availableVariations.length > 1 ? "Choose an option" : "Option"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {availableVariations.map((variation) => (
                  <button
                    key={variation.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(variation.id);
                      setActiveImage(null);
                      setQuantity(1);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                      selectedVariation?.id === variation.id
                        ? "border-brand bg-brand text-brand-foreground"
                        : "border-border bg-background text-foreground hover:border-brand/50"
                    }`}
                  >
                    {variation.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedVariation && level !== "out-of-stock" && (
            <div className="mt-6 flex items-center gap-2 rounded-full border border-border px-1.5 py-1.5 w-fit">
              <button
                type="button"
                aria-label="Decrease quantity"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40"
                disabled={quantity >= selectedVariation.stock}
                onClick={() => setQuantity((q) => Math.min(selectedVariation.stock, q + 1))}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <Button
              variant="brand"
              size="lg"
              className="rounded-full"
              disabled={!selectedVariation || level === "out-of-stock"}
              onClick={handleAddToCart}
            >
              Add to Cart
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full"
              disabled={!selectedVariation || level === "out-of-stock"}
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            {settings?.business && (
              <Button variant="soft" size="lg" className="rounded-full" asChild>
                <a
                  href={whatsappLink(
                    settings.business,
                    `Hi, I'd like to ask about ${product.name}.`,
                  )}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MessageCircle className="mr-1.5 h-4 w-4" /> Ask on WhatsApp
                </a>
              </Button>
            )}
          </div>

          {product.brand && (
            <p className="mt-6 text-sm text-muted-foreground">
              Brand: <span className="font-medium text-foreground">{product.brand}</span>
            </p>
          )}

          <ShareButton title={product.name} />

          {product.warranty && (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-brand" /> {product.warranty} warranty
            </p>
          )}

          {specEntries.length > 0 && (
            <div className="mt-8 border-t border-border pt-6">
              <h2 className="font-display text-sm font-semibold text-foreground">Specifications</h2>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {specEntries.map(([key, value]) => (
                  <div key={key} className="contents">
                    <dt className="capitalize text-muted-foreground">{key.replace(/_/g, " ")}</dt>
                    <dd className="text-foreground">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold text-foreground">Related products</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {related.map((item, index) => (
              <ProductCard key={item.id} product={item} index={index} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function ShareButton({ title }: { title: string }) {
  const share = async () => {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied");
      }
    } catch (error) {
      // Dismissing the native share sheet rejects with AbortError; that's not a failure.
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Couldn't share this product");
    }
  };

  return (
    <button
      type="button"
      onClick={share}
      className="mt-3 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <Share2 className="h-4 w-4" /> Share this product
    </button>
  );
}

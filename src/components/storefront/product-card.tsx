import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Plus, Video } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/storefront/reveal";
import { useCart } from "@/context/cart-context";
import { resolveImage } from "@/lib/images";
import { productPriceLabel, stockLabel, stockLevel, totalStock } from "@/lib/format";
import type { Product } from "@/lib/queries";

const CYCLE_MS = 1100;

/** While hovered, crossfades through a product's extra photos so the tile feels "live". */
function useHoverCycle(count: number) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | undefined>(undefined);

  const stop = () => {
    clearInterval(timer.current);
    setIndex(0);
  };
  const start = () => {
    if (count <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    clearInterval(timer.current);
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), CYCLE_MS);
  };

  useEffect(() => () => clearInterval(timer.current), []);

  return { index, onMouseEnter: start, onMouseLeave: stop, onFocus: start, onBlur: stop };
}

export function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const { addItem } = useCart();
  const stock = totalStock(product);
  const level = stockLevel(stock);
  const availableVariations = product.product_variations.filter((v) => v.is_available);
  const singleVariation = availableVariations.length === 1 ? availableVariations[0] : null;

  const galleryImages = [
    product.image_url,
    ...[...product.product_images].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url),
  ].filter((url, i, all): url is string => Boolean(url) && all.indexOf(url) === i);
  const hover = useHoverCycle(galleryImages.length);
  const displayedImage = resolveImage(galleryImages[hover.index] ?? product.image_url);

  const handleQuickAdd = () => {
    if (!singleVariation) return;
    addItem(
      {
        variationId: singleVariation.id,
        productId: product.id,
        productSlug: product.slug,
        productName: product.name,
        variationName: singleVariation.name,
        price: singleVariation.price,
        image: resolveImage(product.image_url),
        maxStock: singleVariation.stock,
      },
      1,
    );
    toast.success(`${product.name} added to cart`);
  };

  return (
    <Reveal delay={Math.min(index, 7) * 60} className="h-full">
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-shadow duration-300 hover:shadow-lg">
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="relative block aspect-square overflow-hidden bg-secondary"
          onMouseEnter={hover.onMouseEnter}
          onMouseLeave={hover.onMouseLeave}
          onFocus={hover.onFocus}
          onBlur={hover.onBlur}
        >
          <img
            key={displayedImage}
            src={displayedImage}
            alt={product.name}
            loading="lazy"
            className="value-swap h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
          />
          {product.is_featured && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-brand px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-foreground">
              Featured
            </span>
          )}
          {product.video_url && (
            <span className="absolute left-2.5 bottom-2.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white">
              <Video className="h-3.5 w-3.5" />
            </span>
          )}
          {level !== "in-stock" && (
            <span
              className={`absolute right-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${
                level === "out-of-stock"
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-bright/90 text-brand-foreground"
              }`}
            >
              {stockLabel(stock)}
            </span>
          )}
        </Link>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          {product.categories && (
            <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              {product.categories.name}
            </span>
          )}
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="line-clamp-1 font-display text-[15px] font-semibold text-foreground transition-colors group-hover:text-brand"
          >
            {product.name}
          </Link>
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="font-display text-base font-bold text-brand">
              {productPriceLabel(product)}
            </span>
            {singleVariation ? (
              <Button
                size="icon"
                variant="brand"
                className="h-9 w-9 shrink-0 rounded-full"
                aria-label={`Add ${product.name} to cart`}
                disabled={level === "out-of-stock"}
                onClick={handleQuickAdd}
              >
                <Plus className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" variant="soft" className="shrink-0 rounded-full" asChild>
                <Link to="/product/$slug" params={{ slug: product.slug }}>
                  Options
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </Reveal>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card">
      <div className="aspect-square animate-pulse bg-secondary" />
      <div className="flex flex-col gap-2 p-4">
        <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
        <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
        <div className="mt-2 h-5 w-1/2 animate-pulse rounded bg-secondary" />
      </div>
    </div>
  );
}

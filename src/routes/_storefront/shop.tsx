import { useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PackageSearch } from "lucide-react";
import { z } from "zod";

import { EmptyState } from "@/components/storefront/empty-state";
import { ProductCard, ProductCardSkeleton } from "@/components/storefront/product-card";
import { getChildren, getDescendantIds, getRootCategories, getRootOf } from "@/lib/category-tree";
import { categoriesQueryOptions, productsQueryOptions, type Product } from "@/lib/queries";

const shopSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  sort: z.enum(["newest", "price-asc", "price-desc"]).optional(),
  min: z.coerce.number().nonnegative().optional(),
  max: z.coerce.number().nonnegative().optional(),
  instock: z.coerce.boolean().optional(),
});

export const Route = createFileRoute("/_storefront/shop")({
  validateSearch: shopSearchSchema,
  head: () => ({
    meta: [{ title: "Shop | Ozee Electrical" }],
  }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQueryOptions()),
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
  },
  component: ShopPage,
});

const PAGE_SIZE = 12;

function productMinPrice(product: Product): number {
  const available = product.product_variations.filter((v) => v.is_available);
  if (available.length === 0) return 0;
  return Math.min(...available.map((v) => v.price));
}

function ShopPage() {
  const { q, category, sort, min, max, instock } = Route.useSearch();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const navigate = useNavigate({ from: Route.fullPath });

  const { data: products, isLoading } = useQuery(productsQueryOptions());
  const { data: categories } = useQuery(categoriesQueryOptions());

  const rootCategories = useMemo(
    () => (categories ? getRootCategories(categories) : []),
    [categories],
  );
  const selectedCategory = useMemo(
    () => categories?.find((cat) => cat.slug === category),
    [categories, category],
  );
  const selectedRoot = useMemo(
    () => (selectedCategory && categories ? getRootOf(categories, selectedCategory.id) : undefined),
    [categories, selectedCategory],
  );
  const subcategories = useMemo(
    () => (selectedRoot && categories ? getChildren(categories, selectedRoot.id) : []),
    [categories, selectedRoot],
  );
  const matchingCategoryIds = useMemo(() => {
    if (!selectedCategory || !categories) return null;
    return new Set(getDescendantIds(categories, selectedCategory.id));
  }, [categories, selectedCategory]);

  const filtered = useMemo(() => {
    let list = products ?? [];

    if (matchingCategoryIds) {
      list = list.filter(
        (product) => product.categories && matchingCategoryIds.has(product.categories.id),
      );
    }

    if (q) {
      // Every word must appear somewhere in name / category / description / variation names,
      // so "4 gang switch" or "solar inverter" match across fields.
      const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
      list = list.filter((product) => {
        const haystack = [
          product.name,
          product.description ?? "",
          product.categories?.name ?? "",
          ...product.product_variations.map((variation) => variation.name),
        ]
          .join(" ")
          .toLowerCase();
        return tokens.every((token) => haystack.includes(token));
      });
    }

    if (instock) {
      list = list.filter((product) =>
        product.product_variations.some(
          (variation) => variation.is_available && variation.stock > 0,
        ),
      );
    }

    if (min !== undefined || max !== undefined) {
      list = list.filter((product) =>
        product.product_variations.some(
          (variation) =>
            variation.is_available &&
            (min === undefined || variation.price >= min) &&
            (max === undefined || variation.price <= max),
        ),
      );
    }

    const sorted = [...list];
    if (sort === "price-asc") sorted.sort((a, b) => productMinPrice(a) - productMinPrice(b));
    else if (sort === "price-desc") sorted.sort((a, b) => productMinPrice(b) - productMinPrice(a));
    else sorted.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    return sorted;
  }, [products, matchingCategoryIds, q, sort, min, max, instock]);

  const setCategory = (slug: string | undefined) => {
    void navigate({ search: (prev) => ({ ...prev, category: slug }) });
  };

  const setSort = (value: string) => {
    void navigate({
      search: (prev) => ({
        ...prev,
        sort: value === "newest" ? undefined : (value as "price-asc" | "price-desc"),
      }),
    });
  };

  const setNumber = (key: "min" | "max", raw: string) => {
    const value = raw.trim() === "" ? undefined : Number(raw);
    setVisibleCount(PAGE_SIZE);
    void navigate({
      search: (prev) => ({
        ...prev,
        [key]: value !== undefined && !Number.isNaN(value) ? value : undefined,
      }),
    });
  };

  const hasFilters = Boolean(q || category || min !== undefined || max !== undefined || instock);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Shop</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isLoading
              ? "Loading products…"
              : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
            {q ? ` for "${q}"` : ""}
          </p>
        </div>
        <select
          value={sort ?? "newest"}
          onChange={(event) => setSort(event.target.value)}
          className="h-10 rounded-full border border-input bg-background px-4 text-sm text-foreground"
          aria-label="Sort products"
        >
          <option value="newest">Newest</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {rootCategories.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              !category
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
          {rootCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.slug)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                selectedRoot?.id === cat.id
                  ? "bg-brand text-brand-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {selectedRoot && subcategories.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategory(selectedRoot.slug)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === selectedRoot.slug
                ? "bg-cyan/30 text-brand"
                : "bg-secondary/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            All {selectedRoot.name}
          </button>
          {subcategories.map((sub) => (
            <button
              key={sub.id}
              type="button"
              onClick={() => setCategory(sub.slug)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                category === sub.slug
                  ? "bg-cyan/30 text-brand"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-muted-foreground">Price ₦</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            key={`min-${min ?? ""}`}
            defaultValue={min ?? ""}
            onBlur={(event) => setNumber("min", event.target.value)}
            placeholder="Min"
            aria-label="Minimum price"
            className="h-9 w-24 rounded-full border border-input bg-background px-3"
          />
        </label>
        <span aria-hidden="true" className="text-muted-foreground">
          –
        </span>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          key={`max-${max ?? ""}`}
          defaultValue={max ?? ""}
          onBlur={(event) => setNumber("max", event.target.value)}
          placeholder="Max"
          aria-label="Maximum price"
          className="h-9 w-24 rounded-full border border-input bg-background px-3"
        />
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={Boolean(instock)}
            onChange={(event) => {
              setVisibleCount(PAGE_SIZE);
              void navigate({
                search: (prev) => ({ ...prev, instock: event.target.checked ? true : undefined }),
              });
            }}
          />
          <span className="text-muted-foreground">In stock only</span>
        </label>
        {hasFilters && (
          <button
            type="button"
            className="text-brand hover:underline"
            onClick={() => {
              setVisibleCount(PAGE_SIZE);
              void navigate({ search: {} });
            }}
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading &&
          Array.from({ length: 8 }).map((_, index) => <ProductCardSkeleton key={index} />)}
        {!isLoading &&
          filtered
            .slice(0, visibleCount)
            .map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
      </div>

      {!isLoading && filtered.length > visibleCount && (
        <div className="mt-8 text-center">
          <button
            type="button"
            className="rounded-full border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
          >
            Load more ({filtered.length - visibleCount} remaining)
          </button>
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={PackageSearch}
            title="No products found"
            description="Try a different search term or clear the filters."
          />
        </div>
      )}
    </div>
  );
}

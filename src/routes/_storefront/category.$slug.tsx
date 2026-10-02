import { useEffect, useMemo } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ChevronRight, PackageSearch, Zap } from "lucide-react";

import { EmptyState } from "@/components/storefront/empty-state";
import { ProductCard } from "@/components/storefront/product-card";
import { getAncestors, getChildren, getDescendantIds } from "@/lib/category-tree";
import { resolveImage } from "@/lib/images";
import {
  categoriesQueryOptions,
  categoryBySlugQueryOptions,
  productsByCategoryIdsQueryOptions,
} from "@/lib/queries";

export const Route = createFileRoute("/_storefront/category/$slug")({
  loader: async ({ context, params }) => {
    const [category] = await Promise.all([
      context.queryClient.ensureQueryData(categoryBySlugQueryOptions(params.slug)),
      context.queryClient.ensureQueryData(categoriesQueryOptions()),
    ]);
    if (!category) throw notFound();
    const categories = context.queryClient.getQueryData(categoriesQueryOptions().queryKey) ?? [];
    await context.queryClient.ensureQueryData(
      productsByCategoryIdsQueryOptions(getDescendantIds(categories, category.id)),
    );
    return category;
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.name} | Ozee Electrical`
      : "Category | Ozee Electrical";
    const description = loaderData?.description ?? "Shop this category at Ozee Electrical, Lagos.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data: category } = useSuspenseQuery(categoryBySlugQueryOptions(slug));
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions());

  const ancestors = useMemo(
    () => (category ? getAncestors(categories, category.id) : []),
    [categories, category],
  );
  const children = useMemo(
    () => (category ? getChildren(categories, category.id) : []),
    [categories, category],
  );
  const descendantIds = useMemo(
    () => (category ? getDescendantIds(categories, category.id) : []),
    [categories, category],
  );
  const { data: products } = useSuspenseQuery(productsByCategoryIdsQueryOptions(descendantIds));

  useEffect(() => {
    if (category) document.title = `${category.name} | Ozee Electrical`;
  }, [category]);

  if (!category) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav
        aria-label="Breadcrumb"
        className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
      >
        <Link to="/categories" className="hover:text-foreground">
          Categories
        </Link>
        {ancestors.map((ancestor) => (
          <span key={ancestor.id} className="flex items-center gap-1">
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              to="/category/$slug"
              params={{ slug: ancestor.slug }}
              className="hover:text-foreground"
            >
              {ancestor.name}
            </Link>
          </span>
        ))}
        <span className="flex items-center gap-1 font-medium text-foreground">
          <ChevronRight className="h-3.5 w-3.5" />
          {category.name}
        </span>
      </nav>

      <h1 className="mt-3 font-display text-3xl font-bold text-foreground">{category.name}</h1>
      {category.description && (
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{category.description}</p>
      )}

      {children.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Shop by subcategory
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {children.map((child) => (
              <Link
                key={child.id}
                to="/category/$slug"
                params={{ slug: child.slug }}
                className="group relative flex h-28 flex-col justify-end overflow-hidden rounded-2xl border border-border/60 bg-card p-4"
              >
                {child.image_url ? (
                  <img
                    src={resolveImage(child.image_url)}
                    alt={child.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-cyan/20 text-brand">
                    <Zap className="h-4 w-4" />
                  </span>
                )}
                <span className="relative z-10 text-sm font-semibold text-white drop-shadow-sm [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">
                  {child.name}
                </span>
                {child.image_url && (
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="mt-10">
        {children.length > 0 && (
          <h2 className="font-display text-lg font-semibold text-foreground">
            All products in {category.name}
          </h2>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {products.length} product{products.length === 1 ? "" : "s"}
        </p>

        {products.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              icon={PackageSearch}
              title="No products in this category yet"
              description="Check back soon, or browse the full shop."
            />
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

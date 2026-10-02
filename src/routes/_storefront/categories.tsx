import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Zap } from "lucide-react";

import { EmptyState } from "@/components/storefront/empty-state";
import { getChildren, getRootCategories } from "@/lib/category-tree";
import { resolveImage } from "@/lib/images";
import { categoriesQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/categories")({
  head: () => ({ meta: [{ title: "Categories | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQueryOptions()),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { data: categories, isLoading } = useQuery(categoriesQueryOptions());
  const roots = categories ? getRootCategories(categories) : [];

  console.log("ALL STOREFRONT CATEGORIES:", categories);
  console.log("ROOT CATEGORIES:", roots);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Categories</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse by category, then drill into subcategories to find exactly what you need.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading &&
          Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-48 animate-pulse rounded-2xl bg-secondary" />
          ))}
        {roots.map((category) => {
          const children = categories ? getChildren(categories, category.id) : [];
          return (
            <div
              key={category.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card"
            >
              <Link
                to="/category/$slug"
                params={{ slug: category.slug }}
                className="group relative flex h-36 flex-col justify-end overflow-hidden p-5"
              >
                {category.image_url ? (
                  <img
                    src={resolveImage(category.image_url)}
                    alt={category.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <span className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-cyan/20 text-brand">
                    <Zap className="h-5 w-5" />
                  </span>
                )}
                <div className="relative z-10">
                  <h2 className="font-display text-lg font-semibold text-white drop-shadow-sm [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">
                    {category.name}
                  </h2>
                </div>
                {category.image_url && (
                  <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                )}
              </Link>
              {children.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-4 pt-3">
                  {children.slice(0, 6).map((child) => (
                    <Link
                      key={child.id}
                      to="/category/$slug"
                      params={{ slug: child.slug }}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {child.name}
                    </Link>
                  ))}
                  {children.length > 6 && (
                    <Link
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      className="rounded-full px-3 py-1 text-xs font-medium text-brand hover:underline"
                    >
                      +{children.length - 6} more
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!isLoading && roots.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Zap}
            title="No categories yet"
            description="Categories will appear here once added."
          />
        </div>
      )}
    </div>
  );
}

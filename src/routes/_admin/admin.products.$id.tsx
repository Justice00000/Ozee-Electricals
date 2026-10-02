import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/product-form";
import { adminProductByIdQueryOptions } from "@/lib/admin-queries";

export const Route = createFileRoute("/_admin/admin/products/$id")({
  head: () => ({ meta: [{ title: "Edit Product | Ozee Admin" }] }),
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(
      adminProductByIdQueryOptions(params.id),
    );
    if (!product) throw notFound();
    return product;
  },
  component: EditProductPage,
});

function EditProductPage() {
  const { id } = Route.useParams();
  const { data: product } = useSuspenseQuery(adminProductByIdQueryOptions(id));

  if (!product) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-foreground">Edit product</h1>
      <div className="mt-6">
        <ProductForm product={product} />
      </div>
    </div>
  );
}

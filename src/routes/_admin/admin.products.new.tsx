import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { ProductForm } from "@/components/admin/product-form";

export const Route = createFileRoute("/_admin/admin/products/new")({
  head: () => ({ meta: [{ title: "New Product | Ozee Admin" }] }),
  component: NewProductPage,
});

function NewProductPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="mt-3 font-display text-2xl font-bold text-foreground">Add product</h1>
      <div className="mt-6">
        <ProductForm />
      </div>
    </div>
  );
}

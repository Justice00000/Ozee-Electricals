import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { adminProductsQueryOptions, deleteProduct } from "@/lib/admin-queries";
import { productPriceLabel, totalStock } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/products/")({
  head: () => ({ meta: [{ title: "Products | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminProductsQueryOptions()),
  component: AdminProductsPage,
});

function AdminProductsPage() {
  const { data: products, isLoading } = useQuery(adminProductsQueryOptions());
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      toast.success("Product deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      void queryClient.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return products ?? [];
    const term = search.toLowerCase();
    return (products ?? []).filter((product) => product.name.toLowerCase().includes(term));
  }, [products, search]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">Products</h1>
        <Button variant="brand" className="rounded-full" asChild>
          <Link to="/admin/products/new">
            <Plus className="mr-1.5 h-4 w-4" /> Add product
          </Link>
        </Button>
      </div>

      <Input
        placeholder="Search products…"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        className="mt-4 max-w-xs"
      />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium text-foreground">
                  {product.name}
                  {product.is_featured && (
                    <span className="ml-2 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand">
                      Featured
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {product.categories?.name ?? "—"}
                </TableCell>
                <TableCell>{productPriceLabel(product)}</TableCell>
                <TableCell>{totalStock(product)}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      product.is_available
                        ? "bg-mint/20 text-brand"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {product.is_available ? "Published" : "Unpublished"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link
                        to="/admin/products/$id"
                        params={{ id: product.id }}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    </Button>
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Delete ${product.name}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title={`Delete ${product.name}?`}
                      description="This removes the product and all its variations. Past orders that reference it are unaffected."
                      onConfirm={() => deleteMutation.mutate(product.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

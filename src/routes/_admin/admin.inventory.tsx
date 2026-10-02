import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adjustStock,
  adminInventoryQueryOptions,
  setLowStockThreshold,
  type InventoryRow,
} from "@/lib/admin-queries";

export const Route = createFileRoute("/_admin/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventory | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminInventoryQueryOptions()),
  component: AdminInventoryPage,
});

type Filter = "all" | "low" | "out";

function stateOf(row: InventoryRow): Filter | "ok" {
  if (row.stock <= 0) return "out";
  if (row.stock <= row.low_stock_threshold) return "low";
  return "ok";
}

function AdjustDialog({ row, onClose }: { row: InventoryRow | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [threshold, setThreshold] = useState("");

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    void queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
    void queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const adjust = useMutation({
    mutationFn: () => adjustStock(row!.id, Number(delta), reason),
    onSuccess: (newStock) => {
      toast.success(`Stock is now ${newStock}`);
      refresh();
      setDelta("");
      setReason("");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const saveThreshold = useMutation({
    mutationFn: () => setLowStockThreshold(row!.id, Number(threshold)),
    onSuccess: () => {
      toast.success("Low-stock threshold saved");
      refresh();
      setThreshold("");
      onClose();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deltaNumber = Number(delta);
  const deltaValid = Number.isInteger(deltaNumber) && deltaNumber !== 0;
  const thresholdNumber = Number(threshold);
  const thresholdValid =
    threshold !== "" && Number.isInteger(thresholdNumber) && thresholdNumber >= 0;

  return (
    <Dialog open={row !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {row?.product?.name} — {row?.name}
          </DialogTitle>
        </DialogHeader>
        {row && (
          <div className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Current stock: <span className="font-semibold text-foreground">{row.stock}</span>
            </p>

            <div className="space-y-2">
              <Label htmlFor="delta">Adjust by (use a minus sign to remove)</Label>
              <Input
                id="delta"
                type="number"
                inputMode="numeric"
                placeholder="e.g. 20 or -3"
                value={delta}
                onChange={(e) => setDelta(e.target.value)}
              />
              <Label htmlFor="reason">Reason (optional)</Label>
              <Input
                id="reason"
                placeholder="New delivery, damaged, recount…"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
              <Button
                variant="brand"
                disabled={!deltaValid || adjust.isPending}
                onClick={() => adjust.mutate()}
              >
                {adjust.isPending ? "Saving…" : "Apply adjustment"}
              </Button>
            </div>

            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor="threshold">
                Low-stock threshold (currently {row.low_stock_threshold})
              </Label>
              <Input
                id="threshold"
                type="number"
                inputMode="numeric"
                min={0}
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
              />
              <Button
                variant="soft"
                disabled={!thresholdValid || saveThreshold.isPending}
                onClick={() => saveThreshold.mutate()}
              >
                Save threshold
              </Button>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminInventoryPage() {
  const { data: rows, isLoading } = useQuery(adminInventoryQueryOptions());
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<InventoryRow | null>(null);

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (rows ?? []).filter((row) => {
      const state = stateOf(row);
      if (filter === "low" && state !== "low") return false;
      if (filter === "out" && state !== "out") return false;
      if (!term) return true;
      return `${row.product?.name ?? ""} ${row.name} ${row.sku ?? ""}`.toLowerCase().includes(term);
    });
  }, [rows, filter, search]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Inventory</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Stock is tracked per variation. Every adjustment is recorded.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {(["all", "low", "out"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
              filter === value
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {value === "all" ? "All" : value === "low" ? "Low stock" : "Out of stock"}
          </button>
        ))}
        <Input
          className="ml-auto max-w-xs"
          placeholder="Search product, variation or SKU"
          aria-label="Search inventory"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Variation</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && visible.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  {(rows ?? []).length === 0
                    ? "No variations yet. Add a product to start tracking stock."
                    : "Nothing matches this filter."}
                </TableCell>
              </TableRow>
            )}
            {visible.map((row) => {
              const state = stateOf(row);
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground">
                    {row.product?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{row.name}</TableCell>
                  <TableCell className="text-muted-foreground">{row.sku ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={
                        state === "out"
                          ? "font-semibold text-destructive"
                          : state === "low"
                            ? "font-semibold text-amber-600"
                            : "text-foreground"
                      }
                    >
                      {row.stock}
                    </span>
                    {state === "out" && <span className="ml-2 text-xs text-destructive">Out</span>}
                    {state === "low" && <span className="ml-2 text-xs text-amber-600">Low</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="soft" onClick={() => setSelected(row)}>
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <AdjustDialog row={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

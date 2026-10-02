import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { ORDER_STATUSES, adminOrdersQueryOptions } from "@/lib/admin-queries";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/orders/")({
  head: () => ({ meta: [{ title: "Orders | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOrdersQueryOptions()),
  component: AdminOrdersPage,
});

function AdminOrdersPage() {
  const { data: orders, isLoading } = useQuery(adminOrdersQueryOptions());
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (statusFilter === "all") return orders ?? [];
    return (orders ?? []).filter((order) => order.status === statusFilter);
  }, [orders, statusFilter]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Orders</h1>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
            statusFilter === "all"
              ? "bg-brand text-brand-foreground"
              : "bg-secondary text-muted-foreground"
          }`}
        >
          All
        </button>
        {ORDER_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setStatusFilter(status)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-medium capitalize ${
              statusFilter === status
                ? "bg-brand text-brand-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Fulfillment</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Placed</TableHead>
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
            {!isLoading && filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No orders yet.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((order) => (
              <TableRow key={order.id} className="cursor-pointer">
                <TableCell>
                  <Link to="/admin/orders/$id" params={{ id: order.id }} className="block">
                    <span className="font-medium text-foreground">{order.customer_name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {order.customer_phone}
                    </span>
                  </Link>
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">
                  {order.fulfillment_method}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  {formatNaira(order.total)}
                </TableCell>
                <TableCell>
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

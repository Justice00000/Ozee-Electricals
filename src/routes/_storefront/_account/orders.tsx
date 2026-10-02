import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Receipt } from "lucide-react";

import { EmptyState } from "@/components/storefront/empty-state";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { useAuth } from "@/context/auth-context";
import { formatNaira } from "@/lib/format";
import { myOrdersQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/_account/orders")({
  head: () => ({ meta: [{ title: "My Orders | Ozee Electrical" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { session } = useAuth();
  const { data: orders, isLoading } = useQuery({
    ...myOrdersQueryOptions(session?.user.id ?? ""),
    enabled: Boolean(session?.user.id),
  });

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-foreground">My Orders</h1>

      {isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}

      {!isLoading && orders?.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={Receipt}
            title="No orders yet"
            description="Orders you place while signed in will show up here."
          />
        </div>
      )}

      <div className="mt-6 space-y-3">
        {orders?.map((order) => (
          <Link
            key={order.id}
            to="/orders/$id"
            params={{ id: order.id }}
            className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:bg-accent"
          >
            <div>
              <p className="font-medium text-foreground">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(order.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">{formatNaira(order.total)}</span>
              <OrderStatusBadge status={order.status} />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

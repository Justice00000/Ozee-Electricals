import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { formatNaira } from "@/lib/format";
import { myOrderByIdQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/_account/orders/$id")({
  head: () => ({ meta: [{ title: "Order Detail | Ozee Electrical" }] }),
  loader: async ({ context, params }) => {
    const order = await context.queryClient.ensureQueryData(myOrderByIdQueryOptions(params.id));
    if (!order) throw notFound();
    return order;
  },
  component: CustomerOrderDetailPage,
});

function CustomerOrderDetailPage() {
  const { id } = Route.useParams();
  const { data: order } = useSuspenseQuery(myOrderByIdQueryOptions(id));

  if (!order) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <Link
        to="/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> My orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="font-display text-base font-semibold text-foreground">
          {order.fulfillment_method === "pickup" ? "Pickup" : "Delivery"}
        </h2>
        {order.delivery_address && (
          <p className="mt-2 text-sm text-muted-foreground">{order.delivery_address}</p>
        )}
        {(order.city || order.state) && (
          <p className="text-sm text-muted-foreground">
            {[order.city, order.state].filter(Boolean).join(", ")}
          </p>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="font-display text-base font-semibold text-foreground">Items</h2>
        <div className="mt-3 space-y-2">
          {order.order_items.map((item) => (
            <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {item.product_name}
                {item.variation_name ? ` (${item.variation_name})` : ""} × {item.quantity}
              </span>
              <span className="font-medium text-foreground">
                {formatNaira(item.unit_price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
          <span className="text-foreground">Total</span>
          <span className="font-display text-brand">{formatNaira(order.total)}</span>
        </div>
      </div>
    </div>
  );
}

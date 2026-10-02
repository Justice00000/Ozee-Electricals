import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import {
  ORDER_STATUSES,
  adminOrderByIdQueryOptions,
  updateOrderStatus,
  type OrderStatus,
} from "@/lib/admin-queries";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/orders/$id")({
  head: () => ({ meta: [{ title: "Order Detail | Ozee Admin" }] }),
  loader: async ({ context, params }) => {
    const order = await context.queryClient.ensureQueryData(adminOrderByIdQueryOptions(params.id));
    if (!order) throw notFound();
    return order;
  },
  component: AdminOrderDetailPage,
});

function AdminOrderDetailPage() {
  const { id } = Route.useParams();
  const { data: order } = useSuspenseQuery(adminOrderByIdQueryOptions(id));
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<OrderStatus>((order?.status ?? "pending") as OrderStatus);

  const mutation = useMutation({
    mutationFn: (next: OrderStatus) => updateOrderStatus(id, next),
    onSuccess: () => {
      toast.success("Order status updated");
      void queryClient.invalidateQueries({ queryKey: ["admin", "order", id] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!order) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        to="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to orders
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">
          Order #{order.id.slice(0, 8).toUpperCase()}
        </h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-sm text-muted-foreground">{new Date(order.created_at).toLocaleString()}</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-display text-base font-semibold text-foreground">Customer</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="text-foreground">{order.customer_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Account</dt>
              <dd className="text-foreground">
                {order.user_id ? "Registered customer" : "Guest checkout"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Phone</dt>
              <dd className="text-foreground">{order.customer_phone}</dd>
            </div>
            {order.customer_email && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="text-foreground">{order.customer_email}</dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h2 className="font-display text-base font-semibold text-foreground">
            {order.fulfillment_method === "pickup" ? "Pickup" : "Delivery"}
          </h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {order.delivery_address && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">Address</dt>
                <dd className="text-right text-foreground">{order.delivery_address}</dd>
              </div>
            )}
            {order.city && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">City</dt>
                <dd className="text-foreground">{order.city}</dd>
              </div>
            )}
            {order.state && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">State</dt>
                <dd className="text-foreground">{order.state}</dd>
              </div>
            )}
            {order.instructions && (
              <div className="flex justify-between gap-4">
                <dt className="shrink-0 text-muted-foreground">Notes</dt>
                <dd className="text-right text-foreground">{order.instructions}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Payment</dt>
              <dd className="capitalize text-foreground">
                {order.payment_method?.replace(/_/g, " ") ?? "—"}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
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
        <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatNaira(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery fee</span>
            <span className="text-foreground">{formatNaira(order.delivery_fee)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-foreground">Total</span>
            <span className="font-display text-brand">{formatNaira(order.total)}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-5">
        <span className="text-sm font-medium text-foreground">Update status</span>
        <Select value={status} onValueChange={(value) => setStatus(value as OrderStatus)}>
          <SelectTrigger className="w-48 capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="brand"
          className="rounded-full"
          disabled={mutation.isPending || status === order.status}
          onClick={() => status && mutation.mutate(status)}
        >
          {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save
        </Button>
      </div>
    </div>
  );
}

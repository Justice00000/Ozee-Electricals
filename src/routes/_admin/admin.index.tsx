import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Boxes, Clock, PackageCheck, Receipt } from "lucide-react";

import { OrderStatusBadge } from "@/components/admin/order-status-badge";
import { StatCard } from "@/components/admin/stat-card";
import { formatNaira } from "@/lib/format";
import { dashboardStatsQueryOptions } from "@/lib/admin-queries";

export const Route = createFileRoute("/_admin/admin/")({
  head: () => ({ meta: [{ title: "Admin Dashboard | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(dashboardStatsQueryOptions()),
  component: AdminDashboard,
});

function AdminDashboard() {
  const { data: stats, isLoading } = useQuery(dashboardStatsQueryOptions());

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          label="Products"
          value={isLoading ? "…" : (stats?.totalProducts ?? 0)}
          icon={Boxes}
        />
        <StatCard
          label="Orders"
          value={isLoading ? "…" : (stats?.totalOrders ?? 0)}
          icon={Receipt}
        />
        <StatCard
          label="Pending orders"
          value={isLoading ? "…" : (stats?.pendingOrders ?? 0)}
          icon={Clock}
        />
        <StatCard
          label="Completed orders"
          value={isLoading ? "…" : (stats?.completedOrders ?? 0)}
          icon={PackageCheck}
        />
        <StatCard
          label="Low stock"
          value={isLoading ? "…" : (stats?.lowStockVariations ?? 0)}
          icon={AlertTriangle}
          tone="warning"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">Recent orders</h2>
            <Link to="/admin/orders" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {!isLoading && stats?.recentOrders.length === 0 && (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            )}
            {stats?.recentOrders.map((order) => (
              <Link
                key={order.id}
                to="/admin/orders/$id"
                params={{ id: order.id }}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm transition-colors hover:bg-accent"
              >
                <div>
                  <p className="font-medium text-foreground">{order.customer_name}</p>
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

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-foreground">
              Recent products
            </h2>
            <Link to="/admin/products" className="text-xs font-medium text-brand hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {!isLoading && stats?.recentProducts.length === 0 && (
              <p className="text-sm text-muted-foreground">No products yet.</p>
            )}
            {stats?.recentProducts.map((product) => (
              <Link
                key={product.id}
                to="/admin/products/$id"
                params={{ id: product.id }}
                className="flex items-center justify-between rounded-xl border border-border/60 p-3 text-sm transition-colors hover:bg-accent"
              >
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {product.categories?.name ?? "Uncategorized"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    product.is_available
                      ? "bg-mint/20 text-brand"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {product.is_available ? "Published" : "Unpublished"}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

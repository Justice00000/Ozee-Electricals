import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminOrdersQueryOptions, type OrderRow } from "@/lib/admin-queries";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_admin/admin/customers")({
  head: () => ({ meta: [{ title: "Customers | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOrdersQueryOptions()),
  component: AdminCustomersPage,
});

type Customer = {
  key: string;
  name: string;
  phone: string;
  email: string | null;
  orders: number;
  spent: number;
  lastOrder: string;
  hasAccount: boolean;
};

/** Customers are derived from real orders (grouped by phone number); nothing is stored separately. */
function buildCustomers(orders: OrderRow[]): Customer[] {
  const byKey = new Map<string, Customer>();
  // orders arrive newest-first, so the first row seen for a customer has their latest details
  for (const order of orders) {
    const key = order.customer_phone.replace(/\D/g, "") || order.id;
    const existing = byKey.get(key);
    const counted = order.status !== "cancelled";
    if (!existing) {
      byKey.set(key, {
        key,
        name: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        orders: 1,
        spent: counted ? order.total : 0,
        lastOrder: order.created_at,
        hasAccount: order.user_id !== null,
      });
    } else {
      existing.orders += 1;
      if (counted) existing.spent += order.total;
      if (order.user_id !== null) existing.hasAccount = true;
      if (!existing.email && order.customer_email) existing.email = order.customer_email;
    }
  }
  return [...byKey.values()];
}

function AdminCustomersPage() {
  const { data: orders, isLoading } = useQuery(adminOrdersQueryOptions());
  const customers = useMemo(() => buildCustomers(orders ?? []), [orders]);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Customers</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Built from placed orders. Spend excludes cancelled orders.
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total spent</TableHead>
              <TableHead>Last order</TableHead>
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
            {!isLoading && customers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No customers yet. They appear here after their first order.
                </TableCell>
              </TableRow>
            )}
            {customers.map((customer) => (
              <TableRow key={customer.key}>
                <TableCell className="font-medium text-foreground">
                  {customer.name}
                  {customer.hasAccount && (
                    <span className="ml-2 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Account
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <a href={`tel:${customer.phone}`} className="block hover:text-foreground">
                    {customer.phone}
                  </a>
                  {customer.email && (
                    <a
                      href={`mailto:${customer.email}`}
                      className="block text-xs hover:text-foreground"
                    >
                      {customer.email}
                    </a>
                  )}
                </TableCell>
                <TableCell>{customer.orders}</TableCell>
                <TableCell className="font-semibold text-foreground">
                  {formatNaira(customer.spent)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(customer.lastOrder).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

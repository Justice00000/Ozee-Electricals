import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_admin/admin/products")({
  component: ProductsLayout,
});

function ProductsLayout() {
  return <Outlet />;
}
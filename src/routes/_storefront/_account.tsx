import { createFileRoute, Navigate, Outlet } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/_storefront/_account")({
  component: AccountGuard,
});

function AccountGuard() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/account/login" />;
  }

  return <Outlet />;
}

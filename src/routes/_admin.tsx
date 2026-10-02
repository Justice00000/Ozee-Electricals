import { createFileRoute, Navigate, Outlet, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/admin-shell";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/_admin")({
  component: AdminGuard,
});

function AdminGuard() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/30">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" />;
  }

  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-secondary/30 px-4">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-xl font-bold text-foreground">Not authorized</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account ({session.user.email}) doesn't have admin access. Ask an existing admin to
            grant it, or sign in with a different account.
          </p>
          <Button
            variant="outline"
            className="mt-5 rounded-full"
            onClick={() => {
              void signOut().then(() => navigate({ to: "/admin/login" }));
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell>
      <Outlet />
    </AdminShell>
  );
}

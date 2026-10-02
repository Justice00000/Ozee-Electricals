import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/_storefront/_account/account")({
  head: () => ({ meta: [{ title: "My Account | Ozee Electrical" }] }),
  component: AccountPage,
});

function AccountPage() {
  const { session, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    void navigate({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-8">
      <h1 className="font-display text-2xl font-bold text-foreground">My Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">{session?.user.email}</p>

      <div className="mt-6 space-y-3">
        <Link
          to="/orders"
          className="flex items-center justify-between rounded-2xl border border-border/60 bg-card p-5 transition-colors hover:bg-accent"
        >
          <span className="flex items-center gap-3 font-medium text-foreground">
            <Receipt className="h-4 w-4 text-brand" /> Order history
          </span>
          <span className="text-sm text-muted-foreground">View →</span>
        </Link>

        <Button variant="outline" className="w-full rounded-full" onClick={handleSignOut}>
          <LogOut className="mr-1.5 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}

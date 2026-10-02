import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  FileText,
  Home,
  HelpCircle,
  LayoutDashboard,
  Mail,
  Menu,
  Users,
  Boxes,
  ListTree,
  LogOut,
  Package,
  Receipt,
  Settings,
  Store,
  Truck,
  Wrench,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { logoImage } from "@/lib/images";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/products", label: "Products", icon: Package, exact: false },
  { to: "/admin/categories", label: "Categories", icon: ListTree, exact: false },
  { to: "/admin/orders", label: "Orders", icon: Receipt, exact: false },
  { to: "/admin/inventory", label: "Inventory", icon: Boxes, exact: false },
  { to: "/admin/customers", label: "Customers", icon: Users, exact: false },
  { to: "/admin/messages", label: "Messages", icon: Mail, exact: false },
  { to: "/admin/delivery", label: "Delivery", icon: Truck, exact: false },
  { to: "/admin/services", label: "Services", icon: Wrench, exact: false },
  { to: "/admin/faqs", label: "FAQs", icon: HelpCircle, exact: false },
  { to: "/admin/policies", label: "Policies", icon: FileText, exact: false },
  { to: "/admin/homepage", label: "Homepage", icon: Home, exact: false },
  { to: "/admin/business", label: "Business Info", icon: Settings, exact: false },
] as const;

function AdminNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          activeOptions={{ exact: item.exact }}
          onClick={onNavigate}
          className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          activeProps={{ className: "bg-secondary text-foreground" }}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}

function AdminSidebarFooter({ onSignOut }: { onSignOut: () => void }) {
  const { session } = useAuth();
  return (
    <div className="mt-auto space-y-1 border-t border-border pt-3">
      <Link
        to="/"
        className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Store className="h-4 w-4" /> View storefront
      </Link>
      {session?.user.email && (
        <p className="truncate px-3 pt-1 text-xs text-muted-foreground">{session.user.email}</p>
      )}
      <Button variant="ghost" className="w-full justify-start gap-2.5 px-3" onClick={onSignOut}>
        <LogOut className="h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeLabel =
    [...NAV_ITEMS]
      .sort((a, b) => b.to.length - a.to.length)
      .find((item) => pathname === item.to || pathname.startsWith(`${item.to}/`))?.label ??
    "Dashboard";

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    void navigate({ to: "/admin/login" });
  };

  return (
    <div className="flex min-h-screen bg-secondary/30">
      <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-background p-4 md:flex">
        <div className="flex items-center gap-2 px-2 py-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full">
            <img src={logoImage} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="font-display text-sm font-bold text-foreground">Ozee Admin</span>
        </div>
        <div className="mt-6 flex flex-1 flex-col">
          <AdminNavLinks />
        </div>
        <AdminSidebarFooter onSignOut={handleSignOut} />
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-background px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMenuOpen(true)}
            aria-label="Open admin menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <span className="flex-1 truncate font-display text-sm font-semibold text-foreground">
            {activeLabel}
          </span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out">
            <LogOut className="h-4 w-4" />
          </Button>
        </header>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="flex w-72 max-w-[80vw] flex-col p-4">
            <SheetTitle className="sr-only">Admin menu</SheetTitle>
            <div className="flex items-center gap-2 px-2 py-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-full">
                <img src={logoImage} alt="" className="h-full w-full object-cover" />
              </span>
              <span className="font-display text-sm font-bold text-foreground">Ozee Admin</span>
            </div>
            <div className="mt-6 flex flex-1 flex-col overflow-y-auto">
              <AdminNavLinks onNavigate={() => setMenuOpen(false)} />
            </div>
            <AdminSidebarFooter onSignOut={handleSignOut} />
          </SheetContent>
        </Sheet>

        <main className="min-w-0 p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";

import { CartDrawer } from "@/components/storefront/cart-drawer";
import { Footer } from "@/components/storefront/footer";
import { Navbar } from "@/components/storefront/navbar";
import { CartProvider } from "@/context/cart-context";

export const Route = createFileRoute("/_storefront")({
  component: StorefrontLayout,
});

function StorefrontLayout() {
  const pathname = useLocation({ select: (location) => location.pathname });
  return (
    <CartProvider>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-brand-foreground"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <div
            key={pathname}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 motion-reduce:animate-none"
          >
            <Outlet />
          </div>
        </main>
        <Footer />
      </div>
      <CartDrawer />
    </CartProvider>
  );
}

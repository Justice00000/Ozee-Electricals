import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Menu, Search, ShoppingCart, User, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { logoImage } from "@/lib/images";
import { categoriesQueryOptions } from "@/lib/queries";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/categories", label: "Categories" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar() {
  const { count, openCart } = useCart();
  const { session } = useAuth();
  const { data: categories } = useQuery(categoriesQueryOptions());
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);
  const navigate = useNavigate();

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = query.trim();
    setSearchOpen(false);
    void navigate({ to: "/shop", search: trimmed ? { q: trimmed } : {} });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-2" aria-label="Ozee Electrical home">
          <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full shadow-sm">
            <img src={logoImage} alt="" className="h-full w-full object-cover" />
          </span>
          <span className="truncate font-display text-[15px] font-bold tracking-tight text-foreground">
            Ozee Electrical
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              activeOptions={{ exact: link.to === "/" }}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "bg-secondary text-foreground" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search products"
            onClick={() => setSearchOpen((open) => !open)}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="My account" asChild>
            <Link to={session ? "/account" : "/account/login"}>
              <User className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Open cart"
            onClick={openCart}
          >
            <ShoppingCart className="h-4 w-4" />
            {count > 0 && (
              <span
                key={count}
                className="cart-bump absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-bright px-1 text-[9px] font-bold text-brand-foreground"
              >
                {count}
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label="Open menu"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-border/60 px-4 py-3 sm:px-8">
          <form
            onSubmit={submitSearch}
            className="glass-surface flex h-11 items-center gap-2 rounded-2xl px-3"
          >
            <Search className="h-4 w-4 text-brand/60" />
            <input
              ref={searchInputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search inverter, chandelier, 4 gang…"
              className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </form>
        </div>
      )}

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-72">
          <SheetTitle className="font-display">Ozee-Electrical</SheetTitle>
          <nav className="mt-6 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <SheetClose key={link.to} asChild>
                <Link
                  to={link.to}
                  activeOptions={{ exact: link.to === "/" }}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "bg-secondary text-foreground" }}
                >
                  {link.label}
                </Link>
              </SheetClose>
            ))}
          </nav>
          {categories && categories.length > 0 && (
            <div className="mt-6 border-t border-border pt-4">
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Categories
              </p>
              <div className="mt-2 flex flex-col gap-1">
                {categories.map((category) => (
                  <SheetClose key={category.id} asChild>
                    <Link
                      to="/category/$slug"
                      params={{ slug: category.slug }}
                      className="rounded-xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      {category.name}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </header>
  );
}

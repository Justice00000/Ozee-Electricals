import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/storefront/empty-state";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_storefront/cart")({
  head: () => ({ meta: [{ title: "Your Cart | Ozee Electrical" }] }),
  component: CartPage,
});

function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add products from the shop to see them here."
          action={
            <Button variant="brand" asChild>
              <Link to="/shop">Start shopping</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Your Cart</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="space-y-4 md:col-span-2">
          {items.map((item) => (
            <div
              key={item.variationId}
              className="flex gap-4 rounded-2xl border border-border/60 bg-card p-4"
            >
              <img
                src={item.image}
                alt={item.productName}
                className="h-20 w-20 shrink-0 rounded-xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{item.productName}</p>
                    <p className="text-sm text-muted-foreground">{item.variationName}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.productName}`}
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.variationId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 rounded-full border border-border px-1.5 py-1">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                      onClick={() => updateQuantity(item.variationId, item.quantity - 1)}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40"
                      disabled={item.quantity >= item.maxStock}
                      onClick={() => updateQuantity(item.variationId, item.quantity + 1)}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-display font-bold text-brand">
                    {formatNaira(item.price * item.quantity)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Order Summary</h2>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-semibold text-foreground">{formatNaira(subtotal)}</span>
          </div>
          <div className="mt-1 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-muted-foreground">Calculated at checkout</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-display text-lg font-bold text-brand">
              {formatNaira(subtotal)}
            </span>
          </div>
          <Button variant="brand" className="mt-5 w-full rounded-full" asChild>
            <Link to="/checkout">Checkout</Link>
          </Button>
          <Button variant="ghost" className="mt-2 w-full rounded-full" asChild>
            <Link to="/shop">Continue shopping</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

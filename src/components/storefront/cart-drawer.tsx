import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetFooter, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/format";
import { EmptyState } from "@/components/storefront/empty-state";

export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetContent side="right" className="flex w-full flex-col sm:max-w-md">
        <SheetTitle className="font-display">Your cart</SheetTitle>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              icon={ShoppingBag}
              title="Your cart is empty"
              description="Browse the shop and add products to get started."
              action={
                <SheetClose asChild>
                  <Button variant="brand" asChild>
                    <Link to="/shop">Start shopping</Link>
                  </Button>
                </SheetClose>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.variationId} className="flex gap-3 border-b border-border/60 pb-4">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="h-16 w-16 shrink-0 rounded-xl object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-foreground">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">{item.variationName}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 rounded-full border border-border px-1.5 py-1">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-accent"
                          onClick={() => updateQuantity(item.variationId, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="grid h-6 w-6 place-items-center rounded-full text-muted-foreground hover:bg-accent disabled:opacity-40"
                          disabled={item.quantity >= item.maxStock}
                          onClick={() => updateQuantity(item.variationId, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-sm font-semibold text-brand">
                        {formatNaira(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${item.productName} from cart`}
                    className="h-fit text-muted-foreground hover:text-destructive"
                    onClick={() => removeItem(item.variationId)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <SheetFooter className="mt-4 flex-col gap-3 sm:flex-col">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-display text-lg font-bold text-foreground">
                  {formatNaira(subtotal)}
                </span>
              </div>
              <SheetClose asChild>
                <Button variant="brand" className="w-full" asChild>
                  <Link to="/cart">View cart</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button variant="ghost" className="w-full" asChild>
                  <Link to="/shop">Continue shopping</Link>
                </Button>
              </SheetClose>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

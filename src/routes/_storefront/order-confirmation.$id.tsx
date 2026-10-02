import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { formatNaira } from "@/lib/format";
import { siteSettingsQueryOptions, whatsappLink, type OrderConfirmation } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/order-confirmation/$id")({
  head: () => ({ meta: [{ title: "Order Confirmed | Ozee Electrical" }] }),
  component: OrderConfirmationPage,
});

function OrderConfirmationPage() {
  const { id } = Route.useParams();
  const { data: settings } = useQuery(siteSettingsQueryOptions());
  const { session } = useAuth();
  const [order, setOrder] = useState<OrderConfirmation | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem(`ozee-order-${id}`);
      setOrder(raw ? (JSON.parse(raw) as OrderConfirmation) : null);
    } catch {
      setOrder(null);
    }
  }, [id]);

  const shortId = id.slice(0, 8).toUpperCase();
  const whatsappMessage = `Hi, I just placed order #${shortId} on the website. I'd like to confirm delivery/payment details.`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-8">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-mint/20 text-brand">
        <CheckCircle2 className="h-8 w-8" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-bold text-foreground">Order placed!</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Order <span className="font-semibold text-foreground">#{shortId}</span>
        {order?.customer_name ? ` — thanks, ${order.customer_name}.` : "."} We'll reach out by phone
        or WhatsApp shortly to confirm{" "}
        {order?.fulfillment_method === "pickup" ? "pickup timing" : "delivery details and fee"} and
        payment.
      </p>

      {order ? (
        <div className="mt-8 rounded-2xl border border-border/60 bg-card p-6 text-left">
          <h2 className="font-display text-base font-semibold text-foreground">Order summary</h2>
          <div className="mt-3 space-y-2">
            {order.items.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {item.product_name} ({item.variation_name}) × {item.quantity}
                </span>
                <span className="font-medium text-foreground">
                  {formatNaira(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          {order.delivery_fee > 0 && (
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="font-medium text-foreground">{formatNaira(order.delivery_fee)}</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-display text-lg font-bold text-brand">
              {formatNaira(order.total)}
            </span>
          </div>
        </div>
      ) : order === null ? (
        <p className="mt-8 text-sm text-muted-foreground">
          We couldn't show the order details in this browser session. If you placed this order, hang
          tight — we confirm every order by phone or WhatsApp, or message us your order number
          below.
        </p>
      ) : null}

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {settings?.business && (
          <Button variant="brand" size="lg" className="rounded-full" asChild>
            <a
              href={whatsappLink(settings.business, whatsappMessage)}
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle className="mr-1.5 h-4 w-4" /> Message us on WhatsApp
            </a>
          </Button>
        )}
        {session && (
          <Button variant="outline" size="lg" className="rounded-full" asChild>
            <Link to="/orders">View my orders</Link>
          </Button>
        )}
        <Button variant="outline" size="lg" className="rounded-full" asChild>
          <Link to="/shop">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/storefront/empty-state";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { formatNaira } from "@/lib/format";
import { createOrder, deliveryZonesQueryOptions, siteSettingsQueryOptions } from "@/lib/queries";

const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2, "Enter your full name"),
    customerPhone: z.string().trim().min(7, "Enter a valid phone number"),
    customerEmail: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
    fulfillmentMethod: z.enum(["delivery", "pickup"]),
    deliveryAddress: z.string().trim().optional(),
    state: z.string().trim().optional(),
    city: z.string().trim().optional(),
    instructions: z.string().trim().optional(),
    paymentMethod: z.enum(["bank_transfer", "pay_on_delivery"]),
  })
  .refine(
    (data) => data.fulfillmentMethod !== "delivery" || (data.deliveryAddress?.length ?? 0) > 4,
    { message: "Enter a delivery address", path: ["deliveryAddress"] },
  );

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const Route = createFileRoute("/_storefront/checkout")({
  head: () => ({ meta: [{ title: "Checkout | Ozee Electrical" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const { session } = useAuth();
  const { data: settings } = useQuery(siteSettingsQueryOptions());
  const { data: zones } = useQuery(deliveryZonesQueryOptions());
  const [zoneId, setZoneId] = useState<string>("");
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      customerEmail: "",
      fulfillmentMethod: "delivery",
      deliveryAddress: "",
      state: "",
      city: "",
      instructions: "",
      paymentMethod: "bank_transfer",
    },
  });

  useEffect(() => {
    if (session?.user.email && !form.getValues("customerEmail")) {
      form.setValue("customerEmail", session.user.email);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user.email]);

  const fulfillmentMethod = form.watch("fulfillmentMethod");
  const hasZones = (zones?.length ?? 0) > 0;
  const selectedZone = zones?.find((zone) => zone.id === zoneId);
  const deliveryFee = fulfillmentMethod === "delivery" && selectedZone ? selectedZone.fee : 0;
  const pickupAddress =
    settings?.business?.address ?? "Block 29/25, Alaba International Market, Ojo, Lagos";

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-8">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Add products before checking out."
          action={
            <Button variant="brand" asChild>
              <Link to="/shop">Start shopping</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const onSubmit = async (values: CheckoutFormValues) => {
    if (values.fulfillmentMethod === "delivery" && hasZones && !zoneId) {
      toast.error("Please choose a delivery zone");
      return;
    }
    setSubmitting(true);
    try {
      const result = await createOrder({
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        fulfillmentMethod: values.fulfillmentMethod,
        paymentMethod: values.paymentMethod,
        items: items.map((item) => ({ variationId: item.variationId, quantity: item.quantity })),
        ...(values.fulfillmentMethod === "delivery" && zoneId ? { deliveryZoneId: zoneId } : {}),
        ...(values.customerEmail ? { customerEmail: values.customerEmail } : {}),
        ...(values.fulfillmentMethod === "delivery" && values.deliveryAddress
          ? { deliveryAddress: values.deliveryAddress }
          : {}),
        ...(values.state ? { state: values.state } : {}),
        ...(values.city ? { city: values.city } : {}),
        ...(values.instructions ? { instructions: values.instructions } : {}),
      });

      if (typeof window !== "undefined") {
        window.sessionStorage.setItem(`ozee-order-${result.id}`, JSON.stringify(result));
      }
      clearCart();
      void navigate({ to: "/order-confirmation/$id", params: { id: result.id } });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong placing your order.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Checkout</h1>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 md:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <Input placeholder="Chidinma Okafor" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input placeholder="080..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="customerEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (optional)</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fulfillmentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fulfillment</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-2 gap-3"
                    >
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                          field.value === "delivery" ? "border-brand bg-brand/5" : "border-border"
                        }`}
                      >
                        <RadioGroupItem value="delivery" /> Delivery
                      </label>
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                          field.value === "pickup" ? "border-brand bg-brand/5" : "border-border"
                        }`}
                      >
                        <RadioGroupItem value="pickup" /> Pickup
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fulfillmentMethod === "pickup" ? (
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                Pickup at <span className="font-medium text-foreground">{pickupAddress}</span>.
                We'll confirm timing by phone or WhatsApp after you place this order.
              </div>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="deliveryAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street, house number, landmark" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Ojo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State (optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Lagos" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {hasZones ? (
                  <fieldset className="space-y-2">
                    <legend className="text-sm font-medium text-foreground">Delivery zone</legend>
                    <RadioGroup value={zoneId} onValueChange={setZoneId} className="grid gap-2">
                      {zones?.map((zone) => (
                        <label
                          key={zone.id}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
                            zoneId === zone.id ? "border-brand bg-brand/5" : "border-border"
                          }`}
                        >
                          <span className="flex items-center gap-2 font-medium">
                            <RadioGroupItem value={zone.id} /> {zone.name}
                            {zone.estimated_time && (
                              <span className="text-xs font-normal text-muted-foreground">
                                · {zone.estimated_time}
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-foreground">
                            {formatNaira(zone.fee)}
                          </span>
                        </label>
                      ))}
                    </RadioGroup>
                  </fieldset>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Delivery fee isn't set up yet — we'll confirm it with you by phone or WhatsApp
                    before dispatch.
                  </p>
                )}
              </>
            )}

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional instructions (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Gate code, preferred delivery time, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paymentMethod"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment method</FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                      className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                    >
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                          field.value === "bank_transfer"
                            ? "border-brand bg-brand/5"
                            : "border-border"
                        }`}
                      >
                        <RadioGroupItem value="bank_transfer" /> Bank transfer
                      </label>
                      <label
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                          field.value === "pay_on_delivery"
                            ? "border-brand bg-brand/5"
                            : "border-border"
                        }`}
                      >
                        <RadioGroupItem value="pay_on_delivery" /> Pay on delivery/pickup
                      </label>
                    </RadioGroup>
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Online card payment isn't connected yet — we'll share bank details or collect
                    payment in person once your order is confirmed.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full rounded-full"
              disabled={submitting}
            >
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place order
            </Button>
          </form>
        </Form>

        <div className="h-fit rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">Order Summary</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.variationId}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="line-clamp-1 font-medium text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.variationName} × {item.quantity}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-foreground">
                  {formatNaira(item.price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-1 border-t border-border pt-4 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">{formatNaira(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-foreground">
                {fulfillmentMethod === "pickup"
                  ? "Free (pickup)"
                  : selectedZone
                    ? formatNaira(selectedZone.fee)
                    : hasZones
                      ? "Choose a zone"
                      : "Confirmed later"}
              </span>
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-display text-lg font-bold text-brand">
                {formatNaira(subtotal + deliveryFee)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

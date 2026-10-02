import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Clock, Facebook, Mail, MapPin, MessageCircle, Phone } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessage } from "@/lib/admin-queries";
import { siteSettingsQueryOptions, whatsappLink } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/contact")({
  head: () => ({ meta: [{ title: "Contact | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQueryOptions()),
  component: ContactPage,
});

function ContactForm() {
  const [values, setValues] = useState({ name: "", phone: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const mutation = useMutation({
    mutationFn: () =>
      sendContactMessage({
        name: values.name.trim(),
        phone: values.phone.trim(),
        email: values.email.trim(),
        message: values.message.trim(),
      }),
    onSuccess: () => {
      setSent(true);
      setValues({ name: "", phone: "", email: "", message: "" });
    },
    onError: () => toast.error("We couldn't send your message. Please try WhatsApp or call us."),
  });

  const valid =
    values.name.trim().length >= 2 &&
    values.message.trim().length >= 5 &&
    (values.phone.trim() !== "" || values.email.trim() !== "");

  if (sent) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6" role="status">
        <p className="font-display text-lg font-semibold text-foreground">Message sent</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Thanks — we'll get back to you using the phone number or email you gave us.
        </p>
        <Button variant="soft" className="mt-4" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4 rounded-2xl border border-border/60 bg-card p-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) mutation.mutate();
      }}
    >
      <h2 className="font-display text-lg font-semibold text-foreground">Send us a message</h2>
      <div className="space-y-1.5">
        <Label htmlFor="contact-name">Name</Label>
        <Input
          id="contact-name"
          autoComplete="name"
          maxLength={100}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="contact-phone">Phone</Label>
          <Input
            id="contact-phone"
            type="tel"
            autoComplete="tel"
            maxLength={30}
            value={values.phone}
            onChange={(e) => setValues({ ...values, phone: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            maxLength={200}
            value={values.email}
            onChange={(e) => setValues({ ...values, email: e.target.value })}
          />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted-foreground">Give us a phone number or an email.</p>
      <div className="space-y-1.5">
        <Label htmlFor="contact-message">Message</Label>
        <Textarea
          id="contact-message"
          rows={5}
          maxLength={2000}
          value={values.message}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
        />
      </div>
      <Button
        type="submit"
        variant="brand"
        className="rounded-full"
        disabled={!valid || mutation.isPending}
      >
        {mutation.isPending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}

function ContactPage() {
  const { data: settings, isLoading } = useQuery(siteSettingsQueryOptions());
  const business = settings?.business;

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">Contact us</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Questions about a product, pricing, installation or an order — reach us however's easiest.
      </p>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading…</p>}

      {business && (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border/60 bg-card p-6">
            {business.address && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Visit us</p>
                  <p className="text-sm text-muted-foreground">{business.address}</p>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-brand hover:underline"
                  >
                    Open in Google Maps
                  </a>
                </div>
              </div>
            )}

            {business.phone_primary && (
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Call</p>
                  <a
                    href={`tel:${business.phone_primary}`}
                    className="block text-sm text-muted-foreground hover:text-foreground"
                  >
                    {business.phone_primary}
                  </a>
                  {business.phone_secondary && (
                    <a
                      href={`tel:${business.phone_secondary}`}
                      className="block text-sm text-muted-foreground hover:text-foreground"
                    >
                      {business.phone_secondary}
                    </a>
                  )}
                </div>
              </div>
            )}

            {business.email && (
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <a
                    href={`mailto:${business.email}`}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            )}

            {settings?.delivery?.pickup && (
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Pickup</p>
                  <p className="text-sm text-muted-foreground">{settings.delivery.pickup}</p>
                </div>
              </div>
            )}

            {business.facebook && (
              <div className="flex items-start gap-3">
                <Facebook className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                <p className="text-sm text-muted-foreground">{business.facebook}</p>
              </div>
            )}
          </div>

          <div className="flex flex-col justify-center gap-3 rounded-2xl bg-secondary/40 p-6">
            <p className="text-sm text-muted-foreground">
              WhatsApp is the fastest way to reach us for product questions or order updates.
            </p>
            <Button variant="brand" size="lg" className="rounded-full" asChild>
              <a
                href={whatsappLink(business, "Hi, I have a question.")}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="mr-1.5 h-4 w-4" /> Message on WhatsApp
              </a>
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6">
        <ContactForm />
      </div>
    </div>
  );
}

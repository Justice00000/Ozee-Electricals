import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { updateSiteSetting } from "@/lib/admin-queries";
import { siteSettingsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_admin/admin/business")({
  head: () => ({ meta: [{ title: "Business Information | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQueryOptions()),
  component: AdminBusinessPage,
});

const businessSchema = z.object({
  name: z.string().trim().min(2, "Required"),
  phone_primary: z.string().trim().min(7, "Required"),
  phone_secondary: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email").or(z.literal("")).optional(),
  address: z.string().trim().min(4, "Required"),
  whatsapp: z.string().trim().optional(),
  tiktok: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  pickup_note: z.string().trim().optional(),
  delivery_note: z.string().trim().optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

function AdminBusinessPage() {
  const { data: settings, isLoading } = useQuery(siteSettingsQueryOptions());
  const queryClient = useQueryClient();

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessSchema),
    values: {
      name: settings?.business?.name ?? "",
      phone_primary: settings?.business?.phone_primary ?? "",
      phone_secondary: settings?.business?.phone_secondary ?? "",
      email: settings?.business?.email ?? "",
      address: settings?.business?.address ?? "",
      whatsapp: settings?.business?.whatsapp ?? "",
      tiktok: settings?.business?.tiktok ?? "",
      facebook: settings?.business?.facebook ?? "",
      pickup_note: settings?.delivery?.pickup ?? "",
      delivery_note: settings?.delivery?.note ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: BusinessFormValues) => {
      await updateSiteSetting("business", {
        name: values.name,
        phone_primary: values.phone_primary,
        phone_secondary: values.phone_secondary || undefined,
        email: values.email || undefined,
        address: values.address,
        whatsapp: values.whatsapp || undefined,
        tiktok: values.tiktok || undefined,
        facebook: values.facebook || undefined,
      });
      await updateSiteSetting("delivery", {
        pickup: values.pickup_note || undefined,
        note: values.delivery_note || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Business information updated");
      void queryClient.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground">Business Information</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Shown across the storefront — navbar, footer, contact section, and WhatsApp links.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mt-6 space-y-6"
        >
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold text-foreground">Contact</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary phone (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="whatsapp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp number</FormLabel>
                    <FormControl>
                      <Input placeholder="234…" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem className="mt-4">
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold text-foreground">Social media</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tiktok"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>TikTok handle</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="facebook"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook page</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold text-foreground">
              Delivery &amp; pickup
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Fees aren't automated yet (see roadmap) — these are just the notes shown at checkout.
            </p>
            <div className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="pickup_note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pickup note</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="delivery_note"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery note</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            variant="brand"
            className="rounded-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </form>
      </Form>
    </div>
  );
}

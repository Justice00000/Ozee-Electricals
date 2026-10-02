import { createFileRoute, Link } from "@tanstack/react-router";
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
import { ImageUpload } from "@/components/admin/image-upload";
import { Textarea } from "@/components/ui/textarea";
import { resolveImage } from "@/lib/images";
import { updateSiteSetting } from "@/lib/admin-queries";
import { siteSettingsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_admin/admin/homepage")({
  head: () => ({ meta: [{ title: "Homepage | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(siteSettingsQueryOptions()),
  component: AdminHomepagePage,
});

const homepageSchema = z.object({
  hero_title: z.string().trim().min(2, "Required"),
  hero_description: z.string().trim().min(2, "Required"),
  hero_image: z.string().trim().optional(),
  hero_media: z.enum(["image", "video"]),
  hero_video: z.string().trim().optional(),
  hero_poster: z.string().trim().optional(),
  about_intro: z.string().trim().optional(),
});

type HomepageFormValues = z.infer<typeof homepageSchema>;

function AdminHomepagePage() {
  const { data: settings, isLoading } = useQuery(siteSettingsQueryOptions());
  const queryClient = useQueryClient();

  const form = useForm<HomepageFormValues>({
    resolver: zodResolver(homepageSchema),
    values: {
      hero_title: settings?.homepage?.hero_title ?? "",
      hero_description: settings?.homepage?.hero_description ?? "",
      hero_image: settings?.homepage?.hero_image ?? "",
      hero_media: settings?.homepage?.hero_media ?? "image",
      hero_video: settings?.homepage?.hero_video ?? "",
      hero_poster: settings?.homepage?.hero_poster ?? "",
      about_intro: settings?.about?.intro ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: HomepageFormValues) => {
      await updateSiteSetting("homepage", {
        hero_title: values.hero_title,
        hero_description: values.hero_description,
        hero_image: values.hero_image || undefined,
        hero_media: values.hero_media,
        hero_video: values.hero_video || undefined,
        hero_poster: values.hero_poster || undefined,
      });
      await updateSiteSetting("about", {
        intro: values.about_intro || undefined,
      });
    },
    onSuccess: () => {
      toast.success("Homepage updated");
      void queryClient.invalidateQueries({ queryKey: ["site_settings"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-2xl font-bold text-foreground">Homepage</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Controls the hero section customers see first. Featured products are managed from{" "}
        <Link to="/admin/products" className="text-brand hover:underline">
          Products
        </Link>{" "}
        (the "Featured" toggle) — up to 8 show on the homepage.
      </p>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
          className="mt-6 space-y-6"
        >
          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold text-foreground">Hero</h2>
            <div className="mt-4 space-y-4">
              <FormField
                control={form.control}
                name="hero_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Headline</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hero_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supporting text</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hero_image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero image</FormLabel>

                    <FormControl>
                      <ImageUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        folder="homepage"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hero_media"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero shows</FormLabel>

                    <FormControl>
                      <select
                        value={field.value}
                        onChange={field.onChange}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video (falls back to image if empty)</option>
                      </select>
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hero_video"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hero video (MP4, keep it short and under 10 MB)</FormLabel>

                    <FormControl>
                      <ImageUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        folder="homepage"
                        accept="video/mp4,video/webm"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hero_poster"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Video poster image (shown while loading)</FormLabel>

                    <FormControl>
                      <ImageUpload
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        folder="homepage"
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-card p-5">
            <h2 className="font-display text-base font-semibold text-foreground">
              About page intro
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Shown at the top of the public <code>/about</code> page.
            </p>
            <FormField
              control={form.control}
              name="about_intro"
              render={({ field }) => (
                <FormItem className="mt-3">
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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

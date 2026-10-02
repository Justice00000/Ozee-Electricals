import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import {
  adminServicesQueryOptions,
  deleteService,
  saveService,
  slugify,
  type ServiceFormInput,
} from "@/lib/admin-queries";
import type { Service } from "@/lib/queries";

export const Route = createFileRoute("/_admin/admin/services")({
  head: () => ({ meta: [{ title: "Services | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminServicesQueryOptions()),
  component: AdminServicesPage,
});

const serviceSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers and hyphens only"),
  description: z.string().optional(),
  content: z.string().optional(),
  pricingNote: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

function ServiceDialog({ service, trigger }: { service?: Service; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [slugEdited, setSlugEdited] = useState(Boolean(service));
  const queryClient = useQueryClient();

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      title: service?.title ?? "",
      slug: service?.slug ?? "",
      description: service?.description ?? "",
      content: service?.content ?? "",
      pricingNote: service?.pricing_note ?? "",
      imageUrl: service?.image_url ?? "",
      sortOrder: service?.sort_order ?? 0,
      isActive: service?.is_active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ServiceFormValues) => {
      const input: ServiceFormInput = {
        ...(service?.id ? { id: service.id } : {}),
        title: values.title,
        slug: values.slug,
        description: values.description ?? "",
        content: values.content ?? "",
        pricingNote: values.pricingNote ?? "",
        imageUrl: values.imageUrl ?? "",
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      };
      return saveService(input);
    },
    onSuccess: () => {
      toast.success(service ? "Service updated" : "Service created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "Add service"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(event) => {
                        field.onChange(event);
                        if (!slugEdited) form.setValue("slug", slugify(event.target.value));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(event) => {
                        setSlugEdited(true);
                        field.onChange(event);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Short description (shown on cards)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full details (optional, shown on the service page)</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pricingNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pricing note (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Quote after site visit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image (optional)</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      folder="services"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center justify-between">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort order</FormLabel>
                    <FormControl>
                      <Input type="number" className="w-24" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2 space-y-0">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Active</FormLabel>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="submit" variant="brand" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AdminServicesPage() {
  const { data: services, isLoading } = useQuery(adminServicesQueryOptions());
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteService,
    onSuccess: () => {
      toast.success("Service deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "services"] });
      void queryClient.invalidateQueries({ queryKey: ["services"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">Services</h1>
        <ServiceDialog
          trigger={
            <Button variant="brand" className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" /> Add service
            </Button>
          }
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && services?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No services yet.
                </TableCell>
              </TableRow>
            )}
            {services?.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium text-foreground">{service.title}</TableCell>
                <TableCell className="text-muted-foreground">{service.slug}</TableCell>
                <TableCell>{service.sort_order}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      service.is_active ? "bg-mint/20 text-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {service.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <ServiceDialog
                      service={service}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Edit ${service.title}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Delete ${service.title}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title={`Delete ${service.title}?`}
                      description="This removes the service and its page permanently."
                      onConfirm={() => deleteMutation.mutate(service.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

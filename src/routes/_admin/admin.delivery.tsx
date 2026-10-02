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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import {
  adminDeliveryZonesQueryOptions,
  deleteDeliveryZone,
  saveDeliveryZone,
  type DeliveryZoneFormInput,
} from "@/lib/admin-queries";
import { formatNaira } from "@/lib/format";
import type { DeliveryZone } from "@/lib/queries";

export const Route = createFileRoute("/_admin/admin/delivery")({
  head: () => ({ meta: [{ title: "Delivery | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminDeliveryZonesQueryOptions()),
  component: AdminDeliveryPage,
});

const zoneSchema = z.object({
  name: z.string().trim().min(2, "Required"),
  fee: z.coerce.number().min(0, "Must be 0 or more"),
  estimatedTime: z.string().optional(),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});
type ZoneFormValues = z.infer<typeof zoneSchema>;

function ZoneDialog({ zone, trigger }: { zone?: DeliveryZone; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const form = useForm<ZoneFormValues>({
    resolver: zodResolver(zoneSchema),
    defaultValues: {
      name: zone?.name ?? "",
      fee: zone?.fee ?? 0,
      estimatedTime: zone?.estimated_time ?? "",
      sortOrder: zone?.sort_order ?? 0,
      isActive: zone?.is_active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ZoneFormValues) => {
      const input: DeliveryZoneFormInput = {
        ...(zone?.id ? { id: zone.id } : {}),
        name: values.name,
        fee: values.fee,
        estimatedTime: values.estimatedTime ?? "",
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      };
      return saveDeliveryZone(input);
    },
    onSuccess: () => {
      toast.success(zone ? "Zone updated" : "Zone created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "delivery-zones"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
      setOpen(false);
      if (!zone) form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{zone ? "Edit delivery zone" : "Add delivery zone"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zone name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Ojo / Alaba" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee (₦)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="estimatedTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated time</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. 1-2 days" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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

function AdminDeliveryPage() {
  const { data: zones, isLoading } = useQuery(adminDeliveryZonesQueryOptions());
  const queryClient = useQueryClient();
  const deleteMutation = useMutation({
    mutationFn: deleteDeliveryZone,
    onSuccess: () => {
      toast.success("Zone deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "delivery-zones"] });
      void queryClient.invalidateQueries({ queryKey: ["delivery-zones"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">Delivery zones</h1>
        <ZoneDialog
          trigger={
            <Button variant="brand" className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" /> Add zone
            </Button>
          }
        />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        While no active zones exist, checkout charges no delivery fee and says it will be confirmed
        by phone. Once you add active zones, customers must pick one and the fee is added to the
        order server-side.
      </p>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Zone</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Estimated time</TableHead>
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
            {!isLoading && zones?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No delivery zones yet.
                </TableCell>
              </TableRow>
            )}
            {zones?.map((zone) => (
              <TableRow key={zone.id}>
                <TableCell className="font-medium text-foreground">{zone.name}</TableCell>
                <TableCell>{formatNaira(zone.fee)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {zone.estimated_time ?? "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      zone.is_active ? "bg-mint/20 text-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {zone.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <ZoneDialog
                      zone={zone}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Edit ${zone.name}`}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="ghost" size="icon" aria-label={`Delete ${zone.name}`}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title={`Delete ${zone.name}?`}
                      description="Past orders keep their recorded fee and zone name."
                      onConfirm={() => deleteMutation.mutate(zone.id)}
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

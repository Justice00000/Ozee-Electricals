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
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDeleteDialog } from "@/components/admin/confirm-delete-dialog";
import { adminFaqsQueryOptions, deleteFaq, saveFaq, type FaqFormInput } from "@/lib/admin-queries";
import type { Faq } from "@/lib/queries";

export const Route = createFileRoute("/_admin/admin/faqs")({
  head: () => ({ meta: [{ title: "FAQs | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminFaqsQueryOptions()),
  component: AdminFaqsPage,
});

const faqSchema = z.object({
  question: z.string().trim().min(3, "Required"),
  answer: z.string().trim().min(3, "Required"),
  sortOrder: z.coerce.number().int(),
  isActive: z.boolean(),
});

type FaqFormValues = z.infer<typeof faqSchema>;

function FaqDialog({ faq, trigger }: { faq?: Faq; trigger: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const form = useForm<FaqFormValues>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: faq?.question ?? "",
      answer: faq?.answer ?? "",
      sortOrder: faq?.sort_order ?? 0,
      isActive: faq?.is_active ?? true,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FaqFormValues) => {
      const input: FaqFormInput = {
        ...(faq?.id ? { id: faq.id } : {}),
        question: values.question,
        answer: values.answer,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
      };
      return saveFaq(input);
    },
    onSuccess: () => {
      toast.success(faq ? "FAQ updated" : "FAQ created");
      void queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
      void queryClient.invalidateQueries({ queryKey: ["faqs"] });
      setOpen(false);
      form.reset();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{faq ? "Edit FAQ" : "Add FAQ"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="answer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Answer</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
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

function AdminFaqsPage() {
  const { data: faqs, isLoading } = useQuery(adminFaqsQueryOptions());
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: deleteFaq,
    onSuccess: () => {
      toast.success("FAQ deleted");
      void queryClient.invalidateQueries({ queryKey: ["admin", "faqs"] });
      void queryClient.invalidateQueries({ queryKey: ["faqs"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">FAQs</h1>
        <FaqDialog
          trigger={
            <Button variant="brand" className="rounded-full">
              <Plus className="mr-1.5 h-4 w-4" /> Add FAQ
            </Button>
          }
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border/60 bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Question</TableHead>
              <TableHead>Sort</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && faqs?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No FAQs yet.
                </TableCell>
              </TableRow>
            )}
            {faqs?.map((faq) => (
              <TableRow key={faq.id}>
                <TableCell className="max-w-md font-medium text-foreground">
                  {faq.question}
                </TableCell>
                <TableCell>{faq.sort_order}</TableCell>
                <TableCell>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      faq.is_active ? "bg-mint/20 text-brand" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {faq.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <FaqDialog
                      faq={faq}
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Edit FAQ">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <ConfirmDeleteDialog
                      trigger={
                        <Button variant="ghost" size="icon" aria-label="Delete FAQ">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      }
                      title="Delete this FAQ?"
                      description="This removes it from the public FAQ page immediately."
                      onConfirm={() => deleteMutation.mutate(faq.id)}
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

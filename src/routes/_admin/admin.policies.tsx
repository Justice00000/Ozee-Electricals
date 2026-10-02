import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { adminPoliciesQueryOptions, updatePolicyContent } from "@/lib/admin-queries";
import type { Policy } from "@/lib/queries";

export const Route = createFileRoute("/_admin/admin/policies")({
  head: () => ({ meta: [{ title: "Policies | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminPoliciesQueryOptions()),
  component: AdminPoliciesPage,
});

function PolicyDialog({ policy }: { policy: Policy }) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState(policy.content);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () => updatePolicyContent(policy.id, content),
    onSuccess: () => {
      toast.success(`${policy.title} updated`);
      void queryClient.invalidateQueries({ queryKey: ["admin", "policies"] });
      void queryClient.invalidateQueries({ queryKey: ["policy", policy.slug] });
      setOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setContent(policy.content);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Edit ${policy.title}`}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{policy.title}</DialogTitle>
        </DialogHeader>
        <Textarea rows={14} value={content} onChange={(event) => setContent(event.target.value)} />
        <DialogFooter>
          <Button variant="brand" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AdminPoliciesPage() {
  const { data: policies, isLoading } = useQuery(adminPoliciesQueryOptions());

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Policies</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Privacy, terms, returns and warranty pages. These stay placeholder text until edited here.
      </p>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {policies?.map((policy) => (
          <div
            key={policy.id}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{policy.title}</p>
              <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{policy.content}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Last updated {new Date(policy.updated_at).toLocaleDateString()}
              </p>
            </div>
            <PolicyDialog policy={policy} />
          </div>
        ))}
      </div>
    </div>
  );
}

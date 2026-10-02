import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { adminMessagesQueryOptions, deleteMessage, setMessageRead } from "@/lib/admin-queries";

export const Route = createFileRoute("/_admin/admin/messages")({
  head: () => ({ meta: [{ title: "Messages | Ozee Admin" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(adminMessagesQueryOptions()),
  component: AdminMessagesPage,
});

function AdminMessagesPage() {
  const queryClient = useQueryClient();
  const { data: messages, isLoading } = useQuery(adminMessagesQueryOptions());
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["admin", "messages"] });

  const toggleRead = useMutation({
    mutationFn: ({ id, isRead }: { id: string; isRead: boolean }) => setMessageRead(id, isRead),
    onSuccess: refresh,
    onError: (error: Error) => toast.error(error.message),
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteMessage(id),
    onSuccess: () => {
      toast.success("Message deleted");
      refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-foreground">Messages</h1>
      <p className="mt-1 text-sm text-muted-foreground">Enquiries sent from the Contact page.</p>

      <div className="mt-4 space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!isLoading && (messages ?? []).length === 0 && (
          <p className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            No messages yet.
          </p>
        )}
        {(messages ?? []).map((message) => (
          <article
            key={message.id}
            className={`rounded-2xl border bg-card p-5 ${
              message.is_read ? "border-border/60" : "border-brand/40"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {message.name}
                  {!message.is_read && (
                    <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] text-brand-foreground">
                      New
                    </span>
                  )}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {new Date(message.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() => toggleRead.mutate({ id: message.id, isRead: !message.is_read })}
                >
                  Mark {message.is_read ? "unread" : "read"}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  aria-label="Delete message"
                  onClick={() => {
                    if (window.confirm("Delete this message?")) remove.mutate(message.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm text-foreground">{message.message}</p>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              {message.phone && (
                <a
                  href={`tel:${message.phone}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Phone className="h-3.5 w-3.5" /> {message.phone}
                </a>
              )}
              {message.email && (
                <a
                  href={`mailto:${message.email}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Mail className="h-3.5 w-3.5" /> {message.email}
                </a>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

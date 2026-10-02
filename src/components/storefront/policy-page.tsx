import { useSuspenseQuery } from "@tanstack/react-query";

import { policyBySlugQueryOptions } from "@/lib/queries";

export function PolicyPage({ slug }: { slug: string }) {
  const { data: policy } = useSuspenseQuery(policyBySlugQueryOptions(slug));

  if (!policy) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
        <p className="text-sm text-muted-foreground">This page hasn't been set up yet.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">{policy.title}</h1>
      <p className="mt-1 text-xs text-muted-foreground">
        Last updated {new Date(policy.updated_at).toLocaleDateString()}
      </p>
      <div className="mt-6 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {policy.content}
      </div>
    </div>
  );
}

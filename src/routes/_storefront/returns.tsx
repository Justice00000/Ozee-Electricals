import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/policy-page";
import { policyBySlugQueryOptions } from "@/lib/queries";

const SLUG = "returns";

export const Route = createFileRoute("/_storefront/returns")({
  head: () => ({ meta: [{ title: "Return & Refund Policy | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(policyBySlugQueryOptions(SLUG)),
  component: () => <PolicyPage slug={SLUG} />,
});

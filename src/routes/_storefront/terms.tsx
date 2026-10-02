import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/policy-page";
import { policyBySlugQueryOptions } from "@/lib/queries";

const SLUG = "terms";

export const Route = createFileRoute("/_storefront/terms")({
  head: () => ({ meta: [{ title: "Terms & Conditions | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(policyBySlugQueryOptions(SLUG)),
  component: () => <PolicyPage slug={SLUG} />,
});

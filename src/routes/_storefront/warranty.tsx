import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/policy-page";
import { policyBySlugQueryOptions } from "@/lib/queries";

const SLUG = "warranty";

export const Route = createFileRoute("/_storefront/warranty")({
  head: () => ({ meta: [{ title: "Warranty Policy | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(policyBySlugQueryOptions(SLUG)),
  component: () => <PolicyPage slug={SLUG} />,
});

import { createFileRoute } from "@tanstack/react-router";

import { PolicyPage } from "@/components/storefront/policy-page";
import { policyBySlugQueryOptions } from "@/lib/queries";

const SLUG = "privacy-policy";

export const Route = createFileRoute("/_storefront/privacy-policy")({
  head: () => ({ meta: [{ title: "Privacy Policy | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(policyBySlugQueryOptions(SLUG)),
  component: () => <PolicyPage slug={SLUG} />,
});

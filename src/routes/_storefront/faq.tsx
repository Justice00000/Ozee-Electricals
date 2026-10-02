import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HelpCircle } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { EmptyState } from "@/components/storefront/empty-state";
import { faqsQueryOptions } from "@/lib/queries";

export const Route = createFileRoute("/_storefront/faq")({
  head: () => ({ meta: [{ title: "FAQ | Ozee Electrical" }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(faqsQueryOptions()),
  component: FaqPage,
});

function FaqPage() {
  const { data: faqs, isLoading } = useQuery(faqsQueryOptions());

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-8">
      <h1 className="font-display text-3xl font-bold text-foreground">
        Frequently Asked Questions
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Can't find what you need? Reach out on the{" "}
        <Link to="/contact" className="text-brand hover:underline">
          contact page
        </Link>
        .
      </p>

      {!isLoading && faqs?.length === 0 && (
        <div className="mt-8">
          <EmptyState
            icon={HelpCircle}
            title="No FAQs published yet"
            description="Message us directly and we'll get back to you."
          />
        </div>
      )}

      {faqs && faqs.length > 0 && (
        <Accordion type="single" collapsible className="mt-8">
          {faqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id}>
              <AccordionTrigger className="text-left font-display text-base font-semibold">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

import { faqItems } from "@/lib/analityq-data";

type FAQAccordionProps = {
  limit?: number;
};

export function FAQAccordion({ limit }: FAQAccordionProps) {
  const items = limit ? faqItems.slice(0, limit) : faqItems;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <details key={item.question} className="faq-item" open={index === 0}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

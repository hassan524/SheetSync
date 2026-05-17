"use client";

import { faqs } from "@/data/faqs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FaqSection = () => {
  return (
    <section
      id="contact"
      className="py-24 sm:py-32 bg-gray-50 border-t border-gray-100"
    >
      <div className="max-w-3xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-14 scroll-reveal">
          <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">
            Got questions?
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-5">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 sm:px-6 py-2 scroll-reveal-scale">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-gray-100 last:border-0"
              >
                <AccordionTrigger className="text-left py-4 hover:text-primary transition-colors">
                  <span className="text-sm sm:text-base font-medium text-gray-900 pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-500 pb-4 pt-1 text-sm leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <p className="text-sm text-gray-400 text-center mt-8">
          Still have questions?{" "}
          <a
            href="mailto:support@sheetsync.app"
            className="text-primary font-medium hover:underline"
          >
            Contact our support team
          </a>
        </p>
      </div>
    </section>
  );
};

export default FaqSection;

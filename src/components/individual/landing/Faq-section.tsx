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
      className="py-28 sm:py-40 bg-white border-t border-gray-100"
    >
      <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8">
        <div className="text-center mb-20 scroll-reveal">
          <p className="text-sm font-semibold text-blue-600 uppercase tracking-widest mb-3">
            Questions?
          </p>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Find answers to common questions about SheetSync
          </p>
        </div>

        <div className="bg-gray-50 rounded-3xl border-2 border-gray-200 px-8 sm:px-12 py-12 scroll-reveal-scale shadow-lg">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border-b border-gray-200 last:border-0"
              >
                <AccordionTrigger className="text-left py-6 hover:text-blue-600 transition-colors">
                  <span className="text-base sm:text-lg font-semibold text-gray-900 pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-6 pt-2 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <p className="text-base text-gray-600 text-center mt-12">
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


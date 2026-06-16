"use client";

import { useState } from "react";
import { ChevronRight, MessageCircle, Mail } from "lucide-react";
import Link from "next/link";

const faqs = [
  {
    question: "How is SheetSync different from Google Sheets or Excel?",
    answer:
      "SheetSync is built for simplicity and speed. No bloated menus, no steep learning curve — just clean sheets with the features you actually use, plus PDF export and team collaboration built in from the start.",
  },
  {
    question: "What can I do with SheetSync right now?",
    answer:
      "You can create sheets from templates, write formulas, format cells, merge cells, and export your work as a PDF. Real-time collaboration and more advanced features are actively being built.",
  },
  {
    question: "What templates are available?",
    answer:
      "We have templates for budgets, invoices, project plans, and more. Templates come pre-styled with headers, formatting, and structure so you can start filling in data immediately.",
  },
  {
    question: "Does SheetSync support formulas?",
    answer:
      "Yes — SheetSync supports common spreadsheet formulas like SUM, AVERAGE, IF, and more. Formula support is expanding with each update.",
  },
  {
    question: "How does PDF export work?",
    answer:
      "Click export and your sheet is converted to a PDF that preserves your layout, merged cells, column widths, and formatting — ready to send to a client or print.",
  },
  {
    question: "Will there be real-time collaboration?",
    answer:
      "Yes, real-time collaboration with live cursors and instant sync is on the roadmap. The invite system is already in place — full multiplayer editing is coming soon.",
  },
  {
    question: "Do I need to install anything?",
    answer:
      "No. SheetSync runs entirely in the browser. Just sign in and start building — no downloads, no extensions, no setup required.",
  },
];

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section
      id="faq"
      className="py-24 sm:py-32 bg-white border-t border-gray-100 px-5 sm:px-6 lg:px-8"
    >
      <div className="max-w-2xl mx-auto">
        {/* Heading */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-5">
            <MessageCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary uppercase tracking-widest">
              FAQ
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight mb-3">
            Common questions
          </h2>
          <p className="text-base text-gray-500">
            SheetSync is early but growing fast. Can't find your answer?{" "}
            <Link
              href="mailto:support@sheetsync.app"
              className="text-primary font-medium hover:underline"
            >
              Reach out.
            </Link>
          </p>
        </div>

        {/* FAQ list */}
        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = activeIndex === index;
            return (
              <button
                key={index}
                onClick={() => setActiveIndex(isOpen ? null : index)}
                className={`w-full text-left rounded-2xl border transition-all duration-300 px-6 py-5 ${
                  isOpen
                    ? "bg-primary/[0.03] border-primary/20 shadow-sm"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <span
                    className={`text-[15px] font-medium leading-snug transition-colors duration-300 ${
                      isOpen ? "text-gray-900" : "text-gray-700"
                    }`}
                  >
                    {faq.question}
                  </span>
                  <ChevronRight
                    className={`h-4 w-4 flex-shrink-0 mt-0.5 text-gray-400 transition-transform duration-300 ${
                      isOpen ? "rotate-90 text-primary" : ""
                    }`}
                  />
                </div>
                <div
                  className="overflow-hidden transition-all duration-300 ease-out"
                  style={{ maxHeight: isOpen ? "300px" : "0", opacity: isOpen ? 1 : 0 }}
                >
                  <p className="text-sm text-gray-500 leading-relaxed pt-3">
                    {faq.answer}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
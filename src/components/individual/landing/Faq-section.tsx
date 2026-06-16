"use client";

import { useState } from "react";
import { faqs } from "@/data/faqs";
import { ChevronRight, MessageCircle, Mail } from "lucide-react";

const FaqSection = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section
      id="contact"
      className="py-24 sm:py-32 bg-white border-t border-gray-100 px-5 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* Two-column layout: left label + right FAQ cards */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left — sticky heading */}
          <div className="lg:w-[340px] flex-shrink-0 lg:sticky lg:top-32 lg:self-start">
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/10 rounded-full px-4 py-1.5 mb-5">
              <MessageCircle className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-widest">
                FAQ
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-semibold text-gray-900 tracking-tight mb-4">
              Questions?{" "}
              <span className="bg-gradient-to-r from-primary to-emerald-500 bg-clip-text text-transparent">
                Answers.
              </span>
            </h2>
            <p className="text-base text-gray-500 leading-relaxed mb-6">
              Everything you need to know about SheetSync. Can&apos;t find what
              you&apos;re looking for? Reach out directly.
            </p>
            <a
              href="mailto:support@sheetsync.app"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors group"
            >
              <Mail className="h-4 w-4" />
              Contact support
              <ChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Right — FAQ cards */}
          <div className="flex-1 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = activeIndex === index;
              return (
                <button
                  key={index}
                  onClick={() =>
                    setActiveIndex(isOpen ? null : index)
                  }
                  className={`w-full text-left rounded-2xl border transition-all duration-300 px-6 py-5 group ${
                    isOpen
                      ? "bg-primary/[0.03] border-primary/20 shadow-sm"
                      : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <span
                        className={`flex-shrink-0 h-7 w-7 rounded-lg text-xs font-bold flex items-center justify-center mt-0.5 transition-colors duration-300 ${
                          isOpen
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`text-[15px] font-medium transition-colors duration-300 ${
                          isOpen ? "text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {faq.question}
                      </span>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 flex-shrink-0 mt-1 text-gray-400 transition-transform duration-300 ${
                        isOpen ? "rotate-90 text-primary" : ""
                      }`}
                    />
                  </div>

                  {/* Answer — animated expand */}
                  <div
                    className="overflow-hidden transition-all duration-300 ease-out"
                    style={{
                      maxHeight: isOpen ? "200px" : "0",
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="text-sm text-gray-500 leading-relaxed pt-3 pl-11">
                      {faq.answer}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
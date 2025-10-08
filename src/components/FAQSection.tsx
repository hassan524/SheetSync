import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";

export default function FAQSection() {
  const faqs = [
    {
      question: "What is this spreadsheet app?",
      answer: "Our spreadsheet app is a powerful, cloud-based tool that allows you to create, edit, and collaborate on spreadsheets in real-time. Access your data from anywhere, anytime.",
    },
    {
      question: "How do I share my spreadsheet with others?",
      answer: "Simply click the 'Share' button in your spreadsheet, enter the email addresses of people you want to share with, and set their permissions (view, edit, or comment). They'll receive an invitation instantly.",
    },
    {
      question: "Can I work offline?",
      answer: "Yes! Once you've opened a spreadsheet while online, it will be available offline. Any changes you make will automatically sync when you're back online.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use bank-level encryption to protect your data both in transit and at rest. Your spreadsheets are backed up automatically, and you have full control over who can access them.",
    },
    {
      question: "What file formats are supported?",
      answer: "You can import and export Excel (.xlsx, .xls), CSV, and PDF files. Our app also supports real-time collaboration on all file types.",
    },
    {
      question: "How do I get started?",
      answer: "Simply sign up for a free account, and you'll be able to create your first spreadsheet immediately. No credit card required!",
    },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Curious about Google Sheets?
          </h2>
          <p className="text-xl text-gray-600">
            Take a look at our FAQs to learn more.
          </p>
        </div>

        {/* FAQ Accordion */}
        <div className="p-6 md:p-8">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border-b border-gray-200 last:border-0"
              >
                <AccordionTrigger 
                  data-testid={`faq-question-${index}`}
                  className="text-left py-4 hover:text-primary transition-colors"
                >
                  <span className="text-lg text-gray-900 pr-4">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent 
                  data-testid={`faq-answer-${index}`}
                  className="text-gray-600 pb-4 pt-2 leading-relaxed"
                >
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Bottom Line with Text */}
        <div className="mt-12 text-center">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t-2 border-gray-300"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="bg-gray-50 px-4 text-sm text-gray-500 font-medium">
                Still have questions? Contact our support team
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

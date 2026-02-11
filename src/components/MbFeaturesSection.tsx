import { Users, Calculator, PieChart, Check } from "lucide-react";

export default function MbFeaturesSection() {
  const features = [
    {
      icon: <Users className="h-7 w-7 text-white" />,
      bg: "bg-pink-500",
      title: "Real-Time Collaboration",
      description:
        "See changes as they happen with live cursors, instant updates, and conflict resolution. Multiple team members can work on the same spreadsheet simultaneously without any data loss.",
      points: [
        "Live cursor tracking",
        "Instant synchronization",
        "Conflict resolution",
        "Version history",
      ],
    },
    {
      icon: <Calculator className="h-7 w-7 text-white" />,
      bg: "bg-yellow-500",
      title: "Advanced Formulas & Functions",
      description:
        "Leverage hundreds of built-in functions plus custom formulas to automate calculations, analyze data, and create dynamic reports that update automatically.",
      points: [
        "500+ built-in functions",
        "Custom formula builder",
        "Array formulas",
        "Conditional formatting",
      ],
    },
    {
      icon: <PieChart className="h-7 w-7 text-white" />,
      bg: "bg-blue-500",
      title: "Data Visualization",
      description:
        "Transform raw data into compelling visualizations with our intuitive chart builder. Choose from dozens of chart types and customize every element to tell your data story.",
      points: [
        "Interactive charts & graphs",
        "Dashboard creation",
        "Export to multiple formats",
        "Real-time updates",
      ],
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
          Powerful Features
        </h2>
        <p className="text-md md:text-lg text-gray-600 max-w-2xl mx-auto">
          Everything you need to manage data collaboratively—from simple formulas to stunning dashboards.
        </p>
      </div>

      <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-3 gap-10 max-w-6xl mx-auto px-4">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="flex flex-col items-start p-6 bg-gray-50 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={`mb-4 p-3 rounded-full ${feature.bg}`}>
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
            <ul className="space-y-2 text-sm text-gray-700">
              {feature.points.map((point) => (
                <li key={point} className="flex items-start">
                  <Check className="h-4 w-4 text-primary mr-2 mt-0.5" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}

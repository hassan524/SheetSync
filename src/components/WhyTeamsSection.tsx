import { Users, Briefcase, BarChart3 } from "lucide-react";

export default function WhyTeamsSection() {
  const features = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Remote Teams",
      description: "Work together, wherever you are. Real-time sync and mobile-friendly design keep your team aligned.",
      gradient: "from-purple-50 to-indigo-50",
      iconColor: "text-purple-600"
    },
    {
      icon: <Briefcase className="h-8 w-8" />,
      title: "Startups & Indie Hackers",
      description: "Quick to launch, zero setup, and no complicated onboarding — just build and go.",
      gradient: "from-green-50 to-emerald-50",
      iconColor: "text-green-600"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Data Enthusiasts",
      description: "Clean UX and all the essential tools for anyone who works with numbers daily.",
      gradient: "from-yellow-50 to-orange-50",
      iconColor: "text-yellow-600"
    }
  ];

  return (
    <section id="why-teams" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Made for All Kinds of Teams
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Whether you're building a startup, analyzing trends, or managing projects from across the globe, SheetSync adapts to your team.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className={`card-hover bg-gradient-to-br ${feature.gradient} p-8 rounded-2xl`}>
              <div className={`${feature.iconColor} mb-4`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

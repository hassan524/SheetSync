import {
  Users,
  Calculator,
  PieChart,
  Check,
  FunctionSquare,
  LayoutDashboard,
} from "lucide-react";

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to manage data collaboratively, from simple
            calculations to complex business intelligence.
          </p>
        </div>
        {/* Feature Rows Container */}
        <div className="flex flex-col gap-[8rem] mt-[8rem]">
          {/* Real-Time Collaboration */}
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <div className="flex items-center mb-6">
                <div className="bg-primary text-white p-3 rounded-xl mr-4">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">
                  Real-Time Collaboration
                </h3>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                See changes as they happen with live cursors, instant updates,
                and conflict resolution. Multiple team members can work on the
                same spreadsheet simultaneously without any data loss.
              </p>
              <ul className="space-y-3">
                {[
                  "Live cursor tracking",
                  "Instant synchronization",
                  "Conflict resolution",
                  "Version history",
                ].map((text) => (
                  <li key={text} className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-primary mr-3" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full lg:w-1/2 bg-white p-8 rounded-2xl shadow-lg min-h-[300px] flex flex-col justify-center">
              <div className="space-y-4">
                {[
                  {
                    name: "Alice",
                    cell: "B2",
                    color: "bg-primary",
                    pulse: "bg-green-400",
                  },
                  {
                    name: "Bob",
                    cell: "C5",
                    color: "bg-blue-500",
                    pulse: "bg-blue-400",
                  },
                  {
                    name: "Carol",
                    cell: "sheet",
                    color: "bg-purple-500",
                    pulse: "bg-gray-400",
                  },
                ].map(({ name, cell, color, pulse }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div
                        className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white text-sm font-semibold`}
                      >
                        {name[0]}
                      </div>
                      <span className="ml-3 text-gray-700">{`${name} is ${name === "Carol" ? "viewing" : "editing"} cell ${cell}`}</span>
                    </div>
                    <div
                      className={`w-3 h-3 ${pulse} rounded-full ${pulse.includes("gray") ? "" : "animate-pulse"}`}
                    ></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sheet Intelligence */}
          <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <div className="flex items-center mb-6">
                <div className="bg-orange-500 text-white p-3 rounded-xl mr-4">
                  <FunctionSquare className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">
                  Sheet Intelligence
                </h3>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                Go beyond formulas with smart suggestions, autocomplete
                assistance, and AI-enhanced insights based on your data
                patterns.
              </p>
              <ul className="space-y-3">
                {[
                  "Smart autocomplete",
                  "Formula suggestions",
                  "Error detection",
                  "AI insights",
                ].map((text) => (
                  <li key={text} className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-orange-500 mr-3" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full lg:w-1/2 bg-white p-8 rounded-2xl shadow-lg min-h-[300px] flex flex-col justify-center">
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Suggested Formula</p>
                <p className="font-mono text-orange-600">
                  =AVERAGEIF(A:A, &quot;&gt;1000&quot;, B:B)
                </p>
              </div>
              <div className="text-sm text-gray-500 mt-4">
                AI detected 3 outliers in column B.
              </div>
            </div>
          </div>

          {/* Dashboards & Sharing */}
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="w-full lg:w-1/2">
              <div className="flex items-center mb-6">
                <div className="bg-green-600 text-white p-3 rounded-xl mr-4">
                  <LayoutDashboard className="h-8 w-8" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900">
                  Dashboards & Sharing
                </h3>
              </div>
              <p className="text-lg text-gray-600 mb-6">
                Share interactive dashboards with your team or clients.
                Customize permissions, export views, and keep everyone on the
                same page.
              </p>
              <ul className="space-y-3">
                {[
                  "Role-based sharing",
                  "Interactive dashboards",
                  "Custom exports",
                  "Mobile ready",
                ].map((text) => (
                  <li key={text} className="flex items-center text-gray-600">
                    <Check className="h-5 w-5 text-green-600 mr-3" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="w-full lg:w-1/2 bg-white p-8 rounded-2xl shadow-lg min-h-[300px] flex flex-col justify-center">
              <div className="bg-green-50 p-4 rounded-lg text-sm text-gray-700">
                <p>
                  <strong>Shared with:</strong> Marketing Team, Finance
                  Department
                </p>
                <p>
                  <strong>Access:</strong> Edit (3), View (5), Comment (2)
                </p>
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Latest export: July Report.pdf
              </div>
            </div>
          </div>
        </div>{" "}
        {/* end of feature rows container */}
      </div>
    </section>
  );
}
